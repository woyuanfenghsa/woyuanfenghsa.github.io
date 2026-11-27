#!/usr/bin/env python3
from __future__ import annotations

"""
Daily arXiv Paper Radar for Zhewei Liu (刘哲维)
------------------------------------------------
Automatically fetches recent arXiv papers in Generative Vision:
- Core Paradigms (通用核心): Few-Step Distillation + RL, Few-Step Distillation,
  Image/Video RL & Preference Alignment, Image/Video Training Paradigms & Architectures
- Project Domains (主力项目): Image/Video Restoration & Quality Enhancement,
  Lighting / Relighting / Shadow, Color Transfer / Grading, Facial Expression & Portrait Editing

Scores each paper (1-5 stars) by project relevance, groups them by date (YYYY-MM-DD),
merges with existing daily-papers.js (keeping up to 60 days), and writes daily-papers.js.
Uses Python 3 standard library only (zero external dependencies for GitHub Actions).
"""

import datetime
import json
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = ROOT_DIR / "daily-papers.js"
MAX_DAYS_TO_KEEP = 60
MAX_PAPERS_PER_DAY = 28
MIN_SCORE_THRESHOLD = 28

USER_AGENT = "ZheweiPaperRadar/1.0 (https://woyuanfenghsa.github.io; automated daily arXiv digest)"

# 3 focused arXiv queries covering core generative vision paradigms + project domains
ARXIV_QUERIES = [
    {
        "name": "core_paradigms",
        "query": (
            '(cat:cs.CV OR cat:cs.LG) AND ('
            'ti:diffusion OR ti:"flow matching" OR ti:rectified OR ti:distillation '
            'OR ti:GRPO OR ti:DPO OR ti:RLHF OR ti:"few-step" OR ti:consistency '
            'OR ti:DiT OR ti:VAE OR abs:"few-step" OR abs:"flow matching" '
            'OR abs:"step distillation" OR abs:"distribution matching distillation" '
            'OR abs:"diffusion model" AND abs:"reinforcement learning")'
        ),
        "max_results": 200,
    },
    {
        "name": "restoration_lighting_color",
        "query": (
            '(cat:cs.CV OR cat:cs.GR OR cat:eess.IV) AND ('
            'relighting OR relightable OR "light control" OR "lighting control" '
            'OR "color transfer" OR "color grading" OR "tone mapping" OR "color harmonization" '
            'OR "image restoration" OR "video restoration" OR "super-resolution" '
            'OR "super resolution" OR deblurring OR "low-light" OR "shadow generation" OR "shadow removal")'
        ),
        "max_results": 160,
    },
    {
        "name": "expression_portrait_video",
        "query": (
            '(cat:cs.CV OR cat:cs.GR) AND ('
            '"facial expression" OR "expression editing" OR "portrait animation" '
            'OR "talking head" OR "face reenactment" OR "portrait relighting" '
            'OR "head avatar" OR "video diffusion" OR "video generation" OR "video editing")'
        ),
        "max_results": 160,
    },
]

# ---------- Relevance Scoring Rules ----------

# Must contain an explicit visual / image / video / portrait / lighting / restoration context
VISUAL_CONTEXT_GUARD = re.compile(
    r"\b("
    r"image|images|video|videos|visual|vision|photo|photographic|portrait|portraits|"
    r"face|faces|facial|head avatar|talking head|relight|relighting|relightable|"
    r"illumination|lighting|shadow|shading|color transfer|color grading|tone mapping|"
    r"colorization|harmonization|super[- ]resolution|image restoration|video restoration|"
    r"deblurring|dehazing|deraining|inpainting|low[- ]light|upscaling|texture|"
    r"text[- ]to[- ]image|text[- ]to[- ]video|image[- ]to[- ]video|t2i|t2v|i2v|v2v|"
    r"pixel[- ]space|video vae|image tokenizer|video tokenizer|frame interpolation|"
    r"flux|sdxl|sd3|wan2|sora|qwen[- ]image|diffusion transformer|dit|mmdit"
    r")\b",
    re.I,
)

# Exclude clearly off-topic domains (pure LLM / TTS / Speech / Robotics / Embodied / Medical / Remote Sensing)
HARD_EXCLUDE = re.compile(
    r"\b("
    r"text[- ]to[- ]speech|\btts\b|speech synthesis|voice cloning|audio generation|"
    r"embodied|robotic manipulation|robot policy|vision[- ]language[- ]action|\bvla\b|quadruped|humanoid|"
    r"autonomous driving|self[- ]driving|occupancy prediction|lidar|bevfusion|"
    r"mri|ct scan|ultrasound|radiology|pathology|histopathology|x[- ]ray|fundus|retinal|endoscopy|ecg|eeg|"
    r"protein|molecule|molecular|drug discovery|crystal|materials|seismic|sar image|"
    r"hyperspectral|remote sensing|satellite|infrared and visible|thermal image|"
    r"mathematical reasoning|code generation|sql generation|large language models?"
    r")\b",
    re.I,
)

# Core general paradigms (最核心通用方向)
CORE_RULES = [
    {
        "tag": "少步蒸馏",
        "weight": 44,
        "title_bonus": 12,
        "patterns": [
            r"\bfew[- ]step\b",
            r"\bone[- ]step\b",
            r"\b1[- ]step\b",
            r"\b4[- ]step\b",
            r"\bstep distillation\b",
            r"\bconsistency (model|distillation|trajectory)\b",
            r"\bdistribution matching distillation\b",
            r"\bdmd2?\b",
            r"\bmean ?flow\b",
            r"\bshortcut model",
            r"\bflow[- ]?map\b",
            r"\btrajectory distillation\b",
            r"\bprogressive distillation\b",
            r"\badversarial (diffusion )?distillation\b",
            r"\bscore distillation\b",
            r"\bon[- ]policy distillation\b",
            r"\bself[- ]forcing\b|\bmass forcing\b|\bdraft forcing\b",
            r"\b(diffusion|video|image) distillation\b",
            r"\bdistill(ed|ing|ation)?\b.{0,30}\b(diffusion|flow|generator|video|image)\b",
            r"\b(diffusion|flow|generator|video|image)\b.{0,30}\bdistill(ed|ing|ation)\b",
            r"\bfast sampling\b|\baccelerat(ed|ing|ion)\b.{0,25}\b(diffusion|flow|sampling)\b",
        ],
    },
    {
        "tag": "强化学习",
        "weight": 44,
        "title_bonus": 12,
        "patterns": [
            r"\bgrpo\b",
            r"\bflow[- ]?grpo\b",
            r"\bdancegrpo\b",
            r"\bdpo\b",
            r"\bdiffusion[- ]?dpo\b",
            r"\brlhf\b",
            r"\bppo\b",
            r"\breinforcement learning\b",
            r"\bpost[- ]training\b.{0,30}\b(diffusion|flow|video|image|generat)",
            r"\b(diffusion|flow|video|image|generat).{0,30}\bpost[- ]training\b",
            r"\breward model",
            r"\bpreference (optimization|alignment|tuning|learning)\b",
            r"\bpolicy gradient\b",
            r"\badvantage[- ]weighted\b",
            r"\bdiffusionnft\b",
            r"\badjoint matching\b",
            r"\breward[- ](guided|aligned|feedback|driven|finetun|adversarial)",
            r"\btest[- ]time scaling\b.{0,30}\b(diffusion|flow|video|image|generat)",
            r"\bhuman preference\b.{0,30}\b(diffusion|flow|video|image|generat)",
        ],
    },
    {
        "tag": "训练范式",
        "weight": 38,
        "title_bonus": 10,
        "patterns": [
            r"\bflow matching\b",
            r"\brectified flow\b",
            r"\bdiffusion transformer\b|\bmmdit\b",
            r"\btraining paradigm\b|\btraining[- ]free\b.{0,20}\b(diffusion|flow)",
            r"\brepresentation alignment\b|\brepa\b",
            r"\bnoise schedul",
            r"\bpixel[- ]space diffusion\b|\bpixel diffusion\b",
            r"\bvideo vae\b|\bcausal vae\b|\bimage tokenizer\b|\bvideo tokenizer\b|\bstreaming.{0,15}vae\b",
            r"\bclassifier[- ]free guidance\b|\bcfg[- ]free\b|\bguidance[- ]free\b",
            r"\bvelocity prediction\b|\bx[- ]prediction\b|\bv[- ]prediction\b",
            r"\bscaling law.{0,30}\b(diffusion|flow|video|image|generat)",
            r"\bunified (image|visual|multimodal|video) (generation|understanding)",
            r"\bdiscrete diffusion\b.{0,25}\b(image|video|visual)",
            r"\bmasked (image|video) (modeling|generation)\b",
            r"\bautoregressive (image|video) generation\b",
            r"\bdiffusion forcing\b",
        ],
    },
]

# Project vertical application domains (主力落地领域)
DOMAIN_RULES = [
    {
        "tag": "打光与光影",
        "weight": 44,
        "title_bonus": 12,
        "patterns": [
            r"\brelight(ing|able|ed)?\b",
            r"\blighting (control|editing|transfer|synthesis|estimation|generation)\b",
            r"\blight (control|editing|transfer|transport|direction|source)\b",
            r"\billumination (control|editing|transfer|harmonization|estimation)\b",
            r"\bshadow (generation|synthesis|removal|editing|casting|harmonization)\b",
            r"\bneural shading\b|\binverse rendering\b|\bintrinsic (decomposition|prior|image)",
            r"\bic[- ]light\b|\bflash photography\b|\bhdr (imaging|generation|relight)",
            r"\bportrait relight",
            r"\benvironment map\b.{0,25}\b(light|relight|shadi)",
        ],
    },
    {
        "tag": "色彩迁移",
        "weight": 44,
        "title_bonus": 12,
        "patterns": [
            r"\bcolor transfer\b|\bcolour transfer\b",
            r"\bcolor grading\b|\bcolour grading\b",
            r"\btone mapping\b|\btonemapping\b",
            r"\bcolor harmonization\b|\bimage harmonization\b",
            r"\bcolorization\b|\bcolourisation\b",
            r"\b3d lut\b|\blook[- ]up table\b|\blut\b.{0,20}\b(color|tone|grade|photo)",
            r"\bcolor (style|palette|consistency|correction|enhancement|retouching|editing)\b",
            r"\bwhite balance\b|\bphotographic (style|look|retouching)\b",
            r"\bappearance transfer\b|\bstyle[- ]?consistent color\b",
        ],
    },
    {
        "tag": "画质修复",
        "weight": 40,
        "title_bonus": 11,
        "patterns": [
            r"\bimage restoration\b|\bvideo restoration\b",
            r"\bsuper[- ]resolution\b",
            r"\bblind (image|video|face) restoration\b",
            r"\ball[- ]in[- ]one (image |video )?restoration\b",
            r"\bdeblur(ring)?\b|\bdenois(ing|er)\b.{0,25}\b(image|video|real[- ]world|blind)",
            r"\bartifact removal\b|\bcompression artifact\b|\bjpeg artifact\b",
            r"\b(detail|texture|clarity|quality|low[- ]light) enhancement\b",
            r"\bupscal(ing|er)\b.{0,25}\b(image|video|4k|high[- ]res)",
            r"\bface restoration\b|\bportrait restoration\b",
            r"\bdehaz(ing|e)\b|\bderain(ing)?\b|\bdesnow(ing)?\b",
            r"\breal[- ]world (sr|super[- ]resolution|restoration)\b",
        ],
    },
    {
        "tag": "表情与人像",
        "weight": 40,
        "title_bonus": 11,
        "patterns": [
            r"\bfacial expression\b|\bexpression (editing|transfer|synthesis|control|generation|manipulation)\b",
            r"\bmicro[- ]expression\b",
            r"\bportrait animation\b|\bfacial animation\b|\bface animation\b",
            r"\btalking (head|face|portrait)\b",
            r"\bface reenactment\b|\bfacial reenactment\b",
            r"\bhead avatar\b|\bfacial avatar\b|\bportrait avatar\b",
            r"\bemotion (editing|transfer|control|synthesis)\b.{0,25}\b(face|facial|portrait|video|avatar)",
            r"\bgaze (redirection|editing|control)\b",
            r"\bportrait editing\b|\bface editing\b|\bidentity[- ]preserving\b.{0,25}\b(portrait|face|human|video)",
            r"\blip[- ]?sync\b|\baudio[- ]driven.{0,20}\b(portrait|head|face|avatar)",
        ],
    },
]

VIDEO_PATTERN = re.compile(
    r"\b(video|t2v|i2v|v2v|temporal|frame interpolation|motion|wan2|sora|kling|hunyuanvideo|cogvideo|talking head|portrait animation)\b",
    re.I,
)
IMAGE_PATTERN = re.compile(
    r"\b(image|t2i|photo|portrait|picture|flux|sdxl|sd3|qwen[- ]image|pixel[- ]space|super[- ]resolution|relighting|color grading)\b",
    re.I,
)


def base_arxiv_id(aid: str) -> str:
    return re.sub(r"v\d+$", "", aid.strip(), flags=re.I)


def fetch_query(query: str, max_results: int) -> list:
    params = urllib.parse.urlencode(
        {
            "search_query": query,
            "sortBy": "submittedDate",
            "sortOrder": "descending",
            "max_results": max_results,
        }
    )
    url = f"https://export.arxiv.org/api/query?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    last_err = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=35) as resp:
                xml_bytes = resp.read()
            break
        except Exception as exc:
            last_err = exc
            time.sleep(3 * (attempt + 1))
    else:
        raise RuntimeError(f"Failed to fetch arXiv query after 3 retries: {last_err}")

    root = ET.fromstring(xml_bytes)
    ns = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
    results = []
    for entry in root.findall("atom:entry", ns):
        raw_id = (entry.findtext("atom:id", "", ns) or "").strip()
        aid = raw_id.split("/abs/")[-1].strip()
        if not aid or "api/errors" in raw_id:
            continue
        title = " ".join((entry.findtext("atom:title", "", ns) or "").split())
        abstract = " ".join((entry.findtext("atom:summary", "", ns) or "").split())
        published = (entry.findtext("atom:published", "", ns) or "")[:10]
        updated = (entry.findtext("atom:updated", "", ns) or "")[:10]
        authors = [
            " ".join((a.findtext("atom:name", "", ns) or "").split())
            for a in entry.findall("atom:author", ns)
        ]
        cats = [c.attrib.get("term", "") for c in entry.findall("atom:category", ns) if c.attrib.get("term")]
        results.append(
            {
                "arxiv": aid,
                "baseId": base_arxiv_id(aid),
                "title": title,
                "abstract": abstract,
                "published": published,
                "updated": updated,
                "authors": authors[:6],
                "authorCount": len(authors),
                "arxivCats": cats[:4],
                "url": f"https://arxiv.org/abs/{aid}",
                "pdf": f"https://arxiv.org/pdf/{aid}",
            }
        )
    return results


def score_paper(paper: dict) -> dict | None:
    title = paper["title"]
    abstract = paper["abstract"]
    full_text = f"{title}\n{abstract}"

    # Must belong to explicit visual/image/video domain and not pure LLM/TTS/Robotics/Medical
    if not VISUAL_CONTEXT_GUARD.search(full_text):
        return None
    if HARD_EXCLUDE.search(title) or (HARD_EXCLUDE.search(abstract) and not re.search(r"\b(relight|color grading|color transfer|image restoration|video restoration|super[- ]resolution|facial expression|portrait|video diffusion|text[- ]to[- ]image|text[- ]to[- ]video)\b", title, re.I)):
        return None

    score = 0
    core_tags = []
    domain_tags = []

    for rule in CORE_RULES:
        hit_body = any(re.search(p, full_text, re.I) for p in rule["patterns"])
        if hit_body:
            core_tags.append(rule["tag"])
            score += rule["weight"]
            if any(re.search(p, title, re.I) for p in rule["patterns"]):
                score += rule["title_bonus"]

    for rule in DOMAIN_RULES:
        hit_body = any(re.search(p, full_text, re.I) for p in rule["patterns"])
        if hit_body:
            domain_tags.append(rule["tag"])
            score += rule["weight"]
            if any(re.search(p, title, re.I) for p in rule["patterns"]):
                score += rule["title_bonus"]

    if not core_tags and not domain_tags:
        return None

    # Special combo tag: 少步蒸馏强化 (Distillation + RL together!)
    if "少步蒸馏" in core_tags and "强化学习" in core_tags:
        core_tags.insert(0, "少步蒸馏强化")
        score += 18

    # Synergy: Core paradigm + Project vertical domain (直接命中核心+项目双高相关)
    if core_tags and domain_tags:
        score += 16

    # Synergy: Multiple general core paradigms
    if len([t for t in core_tags if t != "少步蒸馏强化"]) >= 2:
        score += 10

    # Synergy: Multiple project domains
    if len(domain_tags) >= 2:
        score += 8

    # Modality detection (图像 / 视频 / 图像 & 视频)
    has_video = bool(VIDEO_PATTERN.search(full_text))
    has_image = bool(IMAGE_PATTERN.search(full_text))
    if has_video and has_image:
        modality = "图像 & 视频"
        score += 4
    elif has_video:
        modality = "视频"
        score += 3
    else:
        modality = "图像"

    score = max(0, min(100, score))
    if score < MIN_SCORE_THRESHOLD:
        return None

    # Calibrated 5-star scale:
    # 5★ (>= 80): Dual-pillar bullseye (Core × Domain, Few-Step RL, or Multi-Core with title hit)
    # 4★ (52..79): Strong direct hit on Distillation / RL / Training Paradigm / Relighting / Color / Restoration / Expression
    # 3★ (38..51): Solid single-pillar match
    # 2★ (28..37): Adjacent read
    if score >= 80:
        stars = 5
    elif score >= 52:
        stars = 4
    elif score >= 38:
        stars = 3
    else:
        stars = 2

    # Build concise Chinese match rationale
    parts = []
    if core_tags:
        parts.append(f"通用核心【{' · '.join(core_tags)}】")
    if domain_tags:
        parts.append(f"项目方向【{' · '.join(domain_tags)}】")
    if modality in ("视频", "图像 & 视频"):
        parts.append(f"模态【{modality}】")
    reason = "命中 " + " + ".join(parts)

    # Compact tags list for filtering
    all_tags = list(dict.fromkeys(core_tags + domain_tags + (["视频方向"] if has_video else [])))

    return {
        "id": f"daily_{paper['baseId']}",
        "arxiv": paper["arxiv"],
        "baseId": paper["baseId"],
        "title": title,
        "authors": paper["authors"],
        "authorCount": paper["authorCount"],
        "date": paper["published"],
        "updated": paper["updated"],
        "modality": modality,
        "stars": stars,
        "score": score,
        "coreTags": core_tags,
        "domainTags": domain_tags,
        "tags": all_tags,
        "reason": reason,
        "abstract": abstract,
        "url": paper["url"],
        "pdf": paper["pdf"],
        "arxivCats": paper["arxivCats"],
    }


def load_existing_daily() -> dict:
    if not OUTPUT_FILE.exists():
        return {}
    text = OUTPUT_FILE.read_text(encoding="utf-8")
    m = re.search(r"window\.DAILY_PAPERS\s*=\s*(\{.*\})\s*;?\s*$", text, re.S)
    if not m:
        return {}
    try:
        data = json.loads(m.group(1))
        existing = {}
        for day_obj in data.get("days", []):
            for p in day_obj.get("papers", []):
                bid = p.get("baseId") or base_arxiv_id(p.get("arxiv", ""))
                if bid:
                    existing[bid] = p
        return existing
    except Exception:
        return {}


def main() -> None:
    existing_map = load_existing_daily()
    print(f"Loaded {len(existing_map)} existing daily papers from {OUTPUT_FILE.name}")

    raw_by_id = {}
    for idx, q in enumerate(ARXIV_QUERIES):
        if idx > 0:
            time.sleep(3.2)  # Respect arXiv API rate limit
        print(f"Querying arXiv [{q['name']}] (max={q['max_results']})...")
        entries = fetch_query(q["query"], q["max_results"])
        print(f"  -> fetched {len(entries)} entries")
        for e in entries:
            bid = e["baseId"]
            if bid not in raw_by_id:
                raw_by_id[bid] = e

    print(f"Total unique raw entries fetched: {len(raw_by_id)}")

    scored_count = 0
    for bid, entry in raw_by_id.items():
        scored = score_paper(entry)
        if scored:
            scored_count += 1
            existing_map[bid] = scored

    print(f"Matched & scored {scored_count} relevant papers in this fetch.")

    # Group by submission date (YYYY-MM-DD)
    by_day: dict[str, list] = {}
    for p in existing_map.values():
        d = p.get("date") or ""
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", d):
            continue
        by_day.setdefault(d, []).append(p)

    # Sort dates descending, keep latest MAX_DAYS_TO_KEEP days
    sorted_dates = sorted(by_day.keys(), reverse=True)[:MAX_DAYS_TO_KEEP]

    days_list = []
    total_papers = 0
    star5_total = 0
    for d in sorted_dates:
        day_papers = by_day[d]
        day_papers.sort(key=lambda x: (-x["stars"], -x["score"], x["baseId"]))
        day_papers = day_papers[:MAX_PAPERS_PER_DAY]
        s5 = sum(1 for x in day_papers if x["stars"] == 5)
        s4 = sum(1 for x in day_papers if x["stars"] == 4)
        total_papers += len(day_papers)
        star5_total += s5
        days_list.append(
            {
                "date": d,
                "count": len(day_papers),
                "star5Count": s5,
                "star4Count": s4,
                "papers": day_papers,
            }
        )

    bj_tz = datetime.timezone(datetime.timedelta(hours=8))
    now_bj = datetime.datetime.now(bj_tz).strftime("%Y-%m-%d %H:%M (UTC+8)")

    payload = {
        "meta": {
            "updatedAt": now_bj,
            "totalDays": len(days_list),
            "totalPapers": total_papers,
            "star5Total": star5_total,
            "latestDate": sorted_dates[0] if sorted_dates else "",
            "schedule": "每日 08:30 (北京时间) GitHub Actions 自动抓取 arXiv",
            "focusSummary": "图像/视频训练范式 · 少步蒸馏 · 强化学习 · 少步蒸馏强化 · 画质修复 · 打光光影 · 色彩迁移 · 表情人像",
        },
        "days": days_list,
    }

    header = (
        "/**\n"
        " * 每日自动追踪论文库 (daily-papers.js)\n"
        " * 由 GitHub Actions (fetch_daily_papers.py) 每日自动从 arXiv 更新并按项目相关度打星。\n"
        " */\n"
    )
    OUTPUT_FILE.write_text(
        header + "window.DAILY_PAPERS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    print(f"Wrote {OUTPUT_FILE} | days={len(days_list)}, papers={total_papers}, 5-star={star5_total}")
    for d in days_list[:5]:
        print(f"  {d['date']}: {d['count']} papers (5★: {d['star5Count']}, 4★: {d['star4Count']})")
        for p in d["papers"][:3]:
            print(f"     {'★'*p['stars']}{'☆'*(5-p['stars'])} ({p['score']}) [{p['modality']}] {p['title'][:75]} | {p['reason']}")


if __name__ == "__main__":
    main()
