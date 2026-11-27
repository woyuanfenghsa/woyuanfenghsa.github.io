/**
 * ============================================================
 * 主应用逻辑、路由与「星辰 · 火焰 · 极昼」实时动态星空引擎 (app.js)
 * ============================================================
 */

(function () {
  const DATA = window.SITE_DATA;
  const COLLECTION = window.PAPER_COLLECTION || {
    meta: { title: "论文收集", range: "", total: 0, priorityCount: 0, benchmarkCount: 0, datasetCount: 0 },
    papers: [],
    benchmarks: [],
    datasets: [],
    methodNotes: []
  };
  const POSTS = window.BLOG_POSTS || [];
  const appEl = document.getElementById("app");
  const progressBar = document.getElementById("reading-progress");
  const toastEl = document.getElementById("toast");

  const state = {
    paperScope: "latest", // "latest" | "priority" | "all" | "mentioned" | "benchmarks" | "datasets"
    paperYear: "全部",
    paperCat: "全部",
    paperQuery: "",
    paperLimit: 30,
    blogTag: "全部",
    blogQuery: ""
  };

  let toastTimer = null;

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 2200);
  }

  function copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast(successMsg))
        .catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast(successMsg);
    } catch {
      showToast("复制失败，请手动选择文本");
    }
    document.body.removeChild(ta);
  }

  /* ---------- Interactive Stars + Embers + Polar Sun Canvas ---------- */
  function initCosmosCanvas() {
    const canvas = document.getElementById("cosmos-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars = [];
    let embers = [];
    let meteors = [];
    let mouse = { x: 0.5, y: 0.5 };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = Math.min(160, Math.floor((width * height) / 9500));
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.65 + 0.35,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.018 + 0.006,
        hue: Math.random() < 0.28 ? "cyan" : Math.random() < 0.55 ? "gold" : "white"
      }));

      const emberCount = Math.min(44, Math.floor(width / 30));
      embers = Array.from({ length: emberCount }, () => spawnEmber(true));
    }

    function spawnEmber(randomY) {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + Math.random() * 60,
        r: Math.random() * 2.4 + 0.8,
        vy: -(Math.random() * 0.55 + 0.22),
        vx: (Math.random() - 0.5) * 0.35,
        drift: Math.random() * Math.PI * 2,
        life: Math.random() * 0.7 + 0.3,
        warm: Math.random()
      };
    }

    function spawnMeteor() {
      meteors.push({
        x: Math.random() * width * 0.8 + width * 0.15,
        y: Math.random() * height * 0.32,
        len: Math.random() * 90 + 70,
        speed: Math.random() * 7 + 8,
        angle: Math.PI * 0.78,
        alpha: 1
      });
    }

    window.addEventListener("resize", resize);
    window.addEventListener(
      "mousemove",
      (e) => {
        mouse.x = e.clientX / Math.max(1, width);
        mouse.y = e.clientY / Math.max(1, height);
      },
      { passive: true }
    );

    resize();

    let frame = 0;
    function draw() {
      frame++;
      const isPolarDay = document.documentElement.getAttribute("data-theme") === "polarday";
      ctx.clearRect(0, 0, width, height);

      const offsetX = (mouse.x - 0.5) * 18;
      const offsetY = (mouse.y - 0.5) * 12;

      // 1. Twinkling Stars (星辰)
      for (const s of stars) {
        s.phase += s.speed;
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase));
        const px = s.x + offsetX * (s.r * 0.45);
        const py = s.y + offsetY * (s.r * 0.45);

        let color;
        if (isPolarDay) {
          // Subtle high-altitude sun motes / polar daylight sparkles
          color =
            s.hue === "gold"
              ? `rgba(224, 136, 48, ${twinkle * 0.34})`
              : `rgba(42, 118, 178, ${twinkle * 0.22})`;
        } else {
          color =
            s.hue === "cyan"
              ? `rgba(138, 232, 255, ${twinkle * 0.85})`
              : s.hue === "gold"
              ? `rgba(255, 222, 158, ${twinkle * 0.9})`
              : `rgba(255, 250, 242, ${twinkle * 0.85})`;
        }

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // 2. Occasional Shooting Star (流星) in Astral Mode
      if (!isPolarDay && !prefersReduced && frame % 240 === 0 && meteors.length < 2) {
        spawnMeteor();
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.alpha -= 0.018;

        if (m.alpha <= 0) {
          meteors.splice(i, 1);
          continue;
        }

        const tx = m.x - Math.cos(m.angle) * m.len;
        const ty = m.y - Math.sin(m.angle) * m.len;
        const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
        grad.addColorStop(0, `rgba(255, 240, 200, ${m.alpha})`);
        grad.addColorStop(0.4, `rgba(124, 226, 255, ${m.alpha * 0.55})`);
        grad.addColorStop(1, "rgba(124, 226, 255, 0)");

        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // 3. Rising Flame Embers (炽焰火星)
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        if (!prefersReduced) {
          e.drift += 0.025;
          e.x += e.vx + Math.sin(e.drift) * 0.3;
          e.y += e.vy;
        }

        const heightRatio = Math.max(0, Math.min(1, e.y / height));
        const alpha = (isPolarDay ? 0.42 : 0.78) * Math.sin(heightRatio * Math.PI) * e.life;

        if (e.y < -30 || e.x < -40 || e.x > width + 40) {
          embers[i] = spawnEmber(false);
          continue;
        }

        const rGlow = e.r * 3.4;
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, rGlow);
        if (e.warm > 0.45) {
          g.addColorStop(0, `rgba(255, 232, 168, ${alpha})`);
          g.addColorStop(0.45, `rgba(255, 118, 52, ${alpha * 0.65})`);
          g.addColorStop(1, "rgba(255, 80, 40, 0)");
        } else {
          g.addColorStop(0, `rgba(255, 196, 130, ${alpha})`);
          g.addColorStop(0.45, `rgba(232, 58, 86, ${alpha * 0.6})`);
          g.addColorStop(1, "rgba(232, 58, 86, 0)");
        }

        ctx.beginPath();
        ctx.arc(e.x, e.y, rGlow, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      if (!prefersReduced) {
        requestAnimationFrame(draw);
      }
    }

    draw();
  }

  /* ---------- Theme Initialization (Astral Ember <-> Polar Day) ---------- */
  function initTheme() {
    const saved = localStorage.getItem("astral-site-theme");
    const theme = saved === "polarday" ? "polarday" : "astral";
    document.documentElement.setAttribute("data-theme", theme);

    document.getElementById("theme-toggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "polarday" ? "astral" : "polarday";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("astral-site-theme", next);
      showToast(next === "polarday" ? "已切换至「极昼天穹」模式" : "已切换至「星辰炽焰」模式");
    });
  }

  /* ---------- Mobile Nav ---------- */
  function initMobileNav() {
    const toggle = document.getElementById("mobile-menu-toggle");
    const nav = document.getElementById("main-nav");
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Brand & Footer Hydration ---------- */
  function hydrateShell() {
    const { profile } = DATA;
    document.title = `${profile.name} · 星辰、火焰与极昼`;
    document.getElementById("brand-name").textContent = profile.name;
    document.getElementById("footer-brand").textContent = `${profile.name} · ${profile.englishName}`;
    document.getElementById("footer-note").textContent = profile.footerNote;
    document.getElementById("footer-copyright").textContent = `© ${new Date().getFullYear()} ${profile.name}`;

    const footerLinks = document.getElementById("footer-links");
    footerLinks.innerHTML = profile.socials
      .map(
        (s) =>
          `<a href="${escapeHtml(s.url)}" ${
            s.url.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""
          }>${escapeHtml(s.label)}</a>`
      )
      .join("");
  }

  /* ---------- Helper Renderers (707-Paper Collection) ---------- */
  function buildBibtex(paper) {
    const slug = (paper.short || paper.id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 18) || paper.id;
    const yr = paper.year || "2026";
    const key = `${slug}${yr}`;
    const eprintLine = paper.arxiv ? `,\n  eprint  = {${paper.arxiv}},\n  archivePrefix = {arXiv}` : "";
    const urlLine = paper.url ? `,\n  url     = {${paper.url}}` : "";
    return `@article{${key},\n  title   = {${paper.title}},\n  year    = {${yr}}${eprintLine}${urlLine}\n}`;
  }

  function renderCollectionPaperCard(paper) {
    let badgeHtml = "";
    if (paper.priWhy === "反复点名") {
      badgeHtml = `<span class="pill pill-flame">🔥 反复点名</span>`;
    } else if (paper.priWhy === "点名") {
      badgeHtml = `<span class="pill pill-flame">⭐ 重点点名</span>`;
    } else if (paper.priWhy === "项目高度相关" || paper.rel === "高度相关") {
      badgeHtml = `<span class="pill pill-gold">✦ 项目高度相关</span>`;
    } else if (paper.mentions > 0) {
      badgeHtml = `<span class="pill pill-accent">提及 ${paper.mentions} 次</span>`;
    }

    let batchHtml = "";
    if (paper.batch) {
      const icon = paper.entryType === "新论文" ? "🆕" : "🔄";
      batchHtml = `<span class="pill pill-accent">${icon} 11.20–27 · ${escapeHtml(
        paper.entryType || "新增"
      )}</span>`;
    }

    const stageHtml = paper.stage
      ? `<span class="pill">${escapeHtml(paper.stage)}</span>`
      : "";

    const catsHtml = (paper.cats || [])
      .slice(0, 4)
      .map((c) => `<span class="pill pill-sage">${escapeHtml(c)}</span>`)
      .join("");

    const metaBits = [];
    if (paper.arxiv) metaBits.push(`arXiv:${escapeHtml(paper.arxiv)}`);
    if (paper.submitted) metaBits.push(`首投 ${escapeHtml(paper.submitted)}`);
    if (paper.discussed) metaBits.push(`讨论 ${escapeHtml(paper.discussed)}`);

    const showShort = paper.short && paper.short !== paper.title;

    return `
      <article class="card pub-card" data-paper-id="${escapeHtml(paper.id)}">
        <div class="pub-meta-top">
          ${batchHtml}
          ${badgeHtml}
          ${catsHtml}
          ${stageHtml}
          ${metaBits.length ? `<span class="pub-note">${metaBits.join(" · ")}</span>` : ""}
        </div>
        <h3 class="pub-title">
          ${showShort ? `<span class="paper-short-name">[${escapeHtml(paper.short)}]</span>` : ""}${escapeHtml(
      paper.title
    )}
        </h3>
        ${paper.method ? `<p class="paper-method">${escapeHtml(paper.method)}</p>` : ""}
        ${
          paper.notes
            ? `<div class="paper-note-box"><strong>阅读重点 / 备注：</strong>${escapeHtml(paper.notes)}</div>`
            : ""
        }
        <div class="pub-actions">
          ${
            paper.url
              ? `<a class="btn btn-ghost" href="${escapeHtml(paper.url)}" target="_blank" rel="noopener noreferrer">原文 / arXiv ↗</a>`
              : ""
          }
          ${
            paper.arxiv
              ? `<button type="button" class="btn btn-ghost js-copy-arxiv" data-arxiv="${escapeHtml(
                  paper.arxiv
                )}">复制 arXiv ID</button>`
              : ""
          }
          <button type="button" class="btn btn-ghost js-copy-paper-bib" data-id="${escapeHtml(
            paper.id
          )}">复制 BibTeX</button>
        </div>
      </article>
    `;
  }

  function renderPostCard(post) {
    return `
      <article class="card card-clickable js-open-post" data-slug="${escapeHtml(post.slug)}">
        <div class="post-card-meta">
          <span class="pill pill-sage">${escapeHtml(post.category)}</span>
          <span>${escapeHtml(post.date)}</span>
          <span>·</span>
          <span>${escapeHtml(post.readTime)}</span>
        </div>
        <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
        <p class="post-card-excerpt">${escapeHtml(post.subtitle)}</p>
        <div class="post-card-footer">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${(post.tags || [])
              .slice(0, 2)
              .map((t) => `<span class="pill">#${escapeHtml(t)}</span>`)
              .join("")}
          </div>
          <span class="read-more">阅读全文 →</span>
        </div>
      </article>
    `;
  }

  /* ---------- Views ---------- */
  function renderHome() {
    const { profile, news } = DATA;
    const totalPapers = COLLECTION.meta.total || COLLECTION.papers.length;
    const featuredPapers = COLLECTION.papers.filter((p) => p.priOrder > 0).slice(0, 4);
    const recentPosts = POSTS.slice(0, 2);

    appEl.innerHTML = `
      <div class="container view-fade">
        <section class="hero-grid">
          <div>
            <div class="eyebrow">${escapeHtml(profile.issueLabel)}</div>
            <h1 class="hero-title">
              ${escapeHtml(profile.name)}
              <span class="hero-en-name">${escapeHtml(profile.englishName)}</span>
            </h1>
            <p class="hero-role">${escapeHtml(profile.role)} · ${escapeHtml(profile.affiliation)}</p>
            <p class="hero-tagline">${escapeHtml(profile.tagline)}</p>
            <div class="hero-actions">
              <a href="#cv" class="btn btn-primary">查看个人简历</a>
              <a href="#papers" class="btn btn-secondary">论文收集 (${totalPapers})</a>
              <a href="#blog" class="btn btn-secondary">阅读博客 (${POSTS.length})</a>
            </div>
            <div class="social-row">
              ${profile.socials
                .map(
                  (s) =>
                    `<a class="social-link" href="${escapeHtml(s.url)}" ${
                      s.url.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""
                    }>${escapeHtml(s.label)} ↗</a>`
                )
                .join("")}
            </div>
          </div>

          <aside class="hero-portrait-card">
            <img src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.name)} 徽章头像" />
            <div class="portrait-caption">
              <span>${escapeHtml(profile.location)}</span>
              <span>69°N · ${escapeHtml(profile.initials)}</span>
            </div>
          </aside>
        </section>

        <section class="editorial-two-col">
          <div class="about-text">
            <div class="eyebrow">ASTRAL PROFILE</div>
            <h2 class="section-title" style="margin-bottom:16px;">关于我与研究方向</h2>
            ${profile.bioParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
            <div class="interest-list">
              ${profile.interests.map((item) => `<span class="pill pill-sage">${escapeHtml(item)}</span>`).join("")}
            </div>
          </div>

          <aside class="news-panel">
            <h3>近期动态 · Starlog</h3>
            <ul class="news-list">
              ${news
                .map(
                  (n) => `
                <li class="news-item">
                  <span class="news-date">${escapeHtml(n.date)}</span>
                  <div>
                    <span class="news-tag">${escapeHtml(n.tag)}</span>
                    <span>${escapeHtml(n.text)}</span>
                  </div>
                </li>
              `
                )
                .join("")}
            </ul>
          </aside>
        </section>

        <section class="section-block">
          <div class="section-header">
            <div>
              <div class="eyebrow">PRIORITY READING LIST</div>
              <h2 class="section-title">精选论文收集 · 优先精读</h2>
            </div>
            <a href="#papers" class="btn btn-ghost">浏览全部 ${totalPapers} 篇论文 →</a>
          </div>
          <div class="pub-list">
            ${featuredPapers.map(renderCollectionPaperCard).join("")}
          </div>
        </section>

        <section class="section-block">
          <div class="section-header">
            <div>
              <div class="eyebrow">LATEST ESSAYS</div>
              <h2 class="section-title">近期博客</h2>
            </div>
            <a href="#blog" class="btn btn-ghost">浏览全部文章 →</a>
          </div>
          <div class="cards-grid-2">
            ${recentPosts.map(renderPostCard).join("")}
          </div>
        </section>
      </div>
    `;

    bindPaperCollectionActions();
    bindPostCardClicks();
  }

  function renderCV() {
    const { profile, cv } = DATA;
    appEl.innerHTML = `
      <div class="container view-fade">
        <div class="cv-banner">
          <div>
            <div class="eyebrow">CURRICULUM VITAE</div>
            <h1 class="section-title" style="font-size:2.15rem;">${escapeHtml(profile.name)} · 个人简历</h1>
            <p class="section-sub">${escapeHtml(profile.role)} · ${escapeHtml(profile.affiliation)} · ${escapeHtml(
      profile.email
    )}</p>
          </div>
          <div class="no-print" style="display:flex;gap:10px;">
            <button type="button" class="btn btn-primary" id="print-cv-btn">导出 / 打印 PDF</button>
            <a href="#papers" class="btn btn-secondary">论文收集 (${COLLECTION.meta.total || COLLECTION.papers.length})</a>
          </div>
        </div>

        <div class="cv-summary">${escapeHtml(cv.summary)}</div>

        <section class="cv-section">
          <h2 class="cv-section-title">教育背景</h2>
          <div class="timeline">
            ${cv.education
              .map(
                (e) => `
              <div class="timeline-item">
                <div class="timeline-period">${escapeHtml(e.period)}<br />${escapeHtml(e.location)}</div>
                <div>
                  <h3 class="timeline-heading">${escapeHtml(e.degree)}</h3>
                  <p class="timeline-org">${escapeHtml(e.institution)}</p>
                  <ul class="timeline-bullets">
                    ${e.details.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
                  </ul>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </section>

        <section class="cv-section">
          <h2 class="cv-section-title">研究与工作经历</h2>
          <div class="timeline">
            ${cv.experience
              .map(
                (ex) => `
              <div class="timeline-item">
                <div class="timeline-period">${escapeHtml(ex.period)}<br />${escapeHtml(ex.location)}</div>
                <div>
                  <h3 class="timeline-heading">${escapeHtml(ex.title)}</h3>
                  <p class="timeline-org">${escapeHtml(ex.organization)}</p>
                  <ul class="timeline-bullets">
                    ${ex.details.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
                  </ul>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </section>

        <section class="cv-section">
          <h2 class="cv-section-title">代表开源与项目</h2>
          <div class="cards-grid-2">
            ${cv.projects
              .map(
                (proj) => `
              <div class="card">
                <div class="post-card-meta">
                  <span>${escapeHtml(proj.period)}</span>
                  <span>·</span>
                  <span>${escapeHtml(proj.role)}</span>
                </div>
                <h3 class="timeline-heading" style="margin-bottom:8px;">
                  <a href="${escapeHtml(proj.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                  proj.name
                )} ↗</a>
                </h3>
                <p style="margin:0;color:var(--ink-secondary);font-size:0.93rem;">${escapeHtml(proj.description)}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </section>

        <section class="cv-section">
          <h2 class="cv-section-title">技能与工具</h2>
          <div class="skills-grid">
            ${cv.skills
              .map(
                (group) => `
              <div class="skill-group">
                <h4>${escapeHtml(group.category)}</h4>
                <div class="skill-chips">
                  ${group.items.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </section>

        <section class="cv-section">
          <h2 class="cv-section-title">荣誉与奖项</h2>
          <ul class="awards-list">
            ${cv.awards
              .map(
                (a) => `
              <li class="award-row">
                <div class="award-left">
                  <span class="award-year">${escapeHtml(a.year)}</span>
                  <strong>${escapeHtml(a.title)}</strong>
                </div>
                <span class="award-issuer">${escapeHtml(a.issuer)}</span>
              </li>
            `
              )
              .join("")}
          </ul>
        </section>
      </div>
    `;

    document.getElementById("print-cv-btn").addEventListener("click", () => window.print());
  }

  function renderPapers() {
    const allPapers = COLLECTION.papers || [];
    const latestBatchId = COLLECTION.meta.latestBatch || "";
    const latestPapers = allPapers
      .filter((p) => p.batch && (!latestBatchId || p.batch === latestBatchId))
      .sort((a, b) => (a.batchOrder || 9999) - (b.batchOrder || 9999));
    const priorityPapers = allPapers.filter((p) => p.priOrder > 0);
    const mentionedPapers = allPapers.filter(
      (p) => (p.priWhy && p.priWhy.includes("点名")) || p.mentions > 0
    );
    const benchmarks = COLLECTION.benchmarks || [];
    const datasets = COLLECTION.datasets || [];
    const methodNotes = COLLECTION.methodNotes || [];

    appEl.innerHTML = `
      <div class="container view-fade">
        <div class="section-header">
          <div>
            <div class="eyebrow">GENERATIVE VISION PAPER ARCHIVE · ${escapeHtml(COLLECTION.meta.range || "")}</div>
            <h1 class="section-title" style="font-size:2.15rem;">论文收集</h1>
            <p class="section-sub">收录生成视觉方向去重论文 ${allPapers.length} 篇（含 11.20–11.27 最新增量 ${latestPapers.length} 篇）、${priorityPapers.length} 篇优先精读清单、Teacher/Student 指标对照与配套数据集。</p>
          </div>
        </div>

        <div class="stats-strip">
          <div class="stat-box">
            <div class="stat-num">${allPapers.length}</div>
            <div class="stat-label">去重收录总论文</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${latestPapers.length}</div>
            <div class="stat-label">11.20–27 最新增量</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${priorityPapers.length}</div>
            <div class="stat-label">优先精读 / 高相关</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${benchmarks.length}</div>
            <div class="stat-label">Teacher 指标对照</div>
          </div>
        </div>

        <div class="scope-tabs" id="paper-scope-tabs">
          <button type="button" class="scope-tab ${state.paperScope === "latest" ? "active" : ""}" data-scope="latest">
            🆕 11.20–27 增量 <span class="scope-count">${latestPapers.length}</span>
          </button>
          <button type="button" class="scope-tab ${state.paperScope === "priority" ? "active" : ""}" data-scope="priority">
            🔥 优先精读 <span class="scope-count">${priorityPapers.length}</span>
          </button>
          <button type="button" class="scope-tab ${state.paperScope === "all" ? "active" : ""}" data-scope="all">
            ✦ 全部收录 <span class="scope-count">${allPapers.length}</span>
          </button>
          <button type="button" class="scope-tab ${state.paperScope === "mentioned" ? "active" : ""}" data-scope="mentioned">
            ⭐ 重点点名 <span class="scope-count">${mentionedPapers.length}</span>
          </button>
          <button type="button" class="scope-tab ${state.paperScope === "benchmarks" ? "active" : ""}" data-scope="benchmarks">
            📊 Teacher 指标对照 <span class="scope-count">${benchmarks.length}</span>
          </button>
          <button type="button" class="scope-tab ${state.paperScope === "datasets" ? "active" : ""}" data-scope="datasets">
            📦 数据集与说明 <span class="scope-count">${datasets.length}</span>
          </button>
        </div>

        <div id="paper-scope-body"></div>
      </div>
    `;

    function getScopedPapers() {
      if (state.paperScope === "latest") return latestPapers;
      if (state.paperScope === "priority") return priorityPapers;
      if (state.paperScope === "mentioned") return mentionedPapers;
      return allPapers;
    }

    function renderScopeBody() {
      const bodyEl = document.getElementById("paper-scope-body");

      if (state.paperScope === "benchmarks") {
        bodyEl.innerHTML = `
          <p class="section-sub" style="margin:0 0 18px;">只做同一篇论文内的可比实验；不同指标名称、归一化或标度不可用于跨论文排名。</p>
          <div class="bench-table-card">
            <div class="table-wrap" style="margin:0;">
              <table class="bench-table">
                <thead>
                  <tr>
                    <th>论文</th>
                    <th>底座 / 任务</th>
                    <th>指标（越高越好）</th>
                    <th>Teacher</th>
                    <th>Student</th>
                    <th>差值</th>
                    <th>结论边界</th>
                    <th>原文</th>
                  </tr>
                </thead>
                <tbody>
                  ${benchmarks
                    .map((b) => {
                      const isPos = typeof b.delta === "number" ? b.delta >= 0 : true;
                      const deltaText =
                        typeof b.delta === "number"
                          ? `${b.delta >= 0 ? "+" : ""}${b.delta}`
                          : escapeHtml(b.delta);
                      return `
                        <tr>
                          <td><strong>${escapeHtml(b.paper)}</strong><br /><span class="pub-note">${escapeHtml(
                        b.arxiv
                      )}</span></td>
                          <td>${escapeHtml(b.base)}</td>
                          <td>${escapeHtml(b.metric)}</td>
                          <td class="bench-num">${escapeHtml(b.teacher)}</td>
                          <td class="bench-num">${escapeHtml(b.student)}</td>
                          <td class="${isPos ? "delta-pos" : "delta-neg"}">${deltaText}</td>
                          <td style="color:var(--ink-secondary);min-width:220px;">${escapeHtml(b.boundary)}</td>
                          <td>${
                            b.url
                              ? `<a class="btn btn-ghost" href="${escapeHtml(
                                  b.url
                                )}" target="_blank" rel="noopener noreferrer">链接 ↗</a>`
                              : "-"
                          }</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        `;
        return;
      }

      if (state.paperScope === "datasets") {
        bodyEl.innerHTML = `
          <h2 class="cv-section-title" style="margin-top:8px;">配套数据集与模型权重</h2>
          <div class="cards-grid-2" style="margin-bottom:38px;">
            ${datasets
              .map(
                (d) => `
              <div class="card">
                <div class="pub-meta-top">
                  <span class="pill pill-sage">${escapeHtml(d.type)}</span>
                </div>
                <h3 class="pub-title" style="margin-bottom:8px;">${escapeHtml(d.name)}</h3>
                <p class="paper-method" style="margin-bottom:14px;">${escapeHtml(d.desc)}</p>
                <a class="btn btn-ghost" href="${escapeHtml(
                  d.url
                )}" target="_blank" rel="noopener noreferrer">打开 Hugging Face / 入口 ↗</a>
              </div>
            `
              )
              .join("")}
          </div>

          <h2 class="cv-section-title">收录口径与核对说明</h2>
          <div class="pub-list">
            ${methodNotes
              .map(
                (n) => `
              <div class="card">
                <div class="pub-meta-top">
                  <span class="pill pill-accent">${escapeHtml(n.type)}</span>
                  <strong style="color:var(--ink);">${escapeHtml(n.name)}</strong>
                </div>
                <p class="paper-method" style="margin:0;">${escapeHtml(n.desc)}</p>
              </div>
            `
              )
              .join("")}
          </div>
        `;
        return;
      }

      // Paper list scopes: priority | all | mentioned
      const scoped = getScopedPapers();
      const catCounts = new Map();
      for (const p of scoped) {
        const list = state.paperScope === "priority" && p.priDir ? [p.priDir] : p.cats || [];
        for (const c of list) {
          catCounts.set(c, (catCounts.get(c) || 0) + 1);
        }
      }
      const sortedCats = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1]);
      if (state.paperCat !== "全部" && !catCounts.has(state.paperCat)) {
        state.paperCat = "全部";
      }

      const years = [
        "全部",
        ...Array.from(new Set(scoped.map((p) => p.year).filter(Boolean))).sort((a, b) => b.localeCompare(a))
      ];
      if (state.paperYear !== "全部" && !years.includes(state.paperYear)) {
        state.paperYear = "全部";
      }

      bodyEl.innerHTML = `
        <div class="filter-toolbar">
          <div class="filter-pills" id="paper-year-filters">
            ${years
              .map(
                (y) =>
                  `<button type="button" class="filter-pill ${
                    state.paperYear === y ? "active" : ""
                  }" data-year="${escapeHtml(y)}">${y === "全部" ? "全部年份" : escapeHtml(y)}</button>`
              )
              .join("")}
          </div>
          <input
            type="search"
            id="paper-search"
            class="search-input"
            style="min-width:290px;"
            placeholder="搜索简称、英文标题、arXiv ID、方法或备注..."
            value="${escapeHtml(state.paperQuery)}"
          />
        </div>

        <div class="cat-filter-row" id="paper-cat-filters">
          <button type="button" class="filter-pill ${
            state.paperCat === "全部" ? "active" : ""
          }" data-cat="全部">全部方向 <span class="cat-count">${scoped.length}</span></button>
          ${sortedCats
            .map(
              ([cat, count]) =>
                `<button type="button" class="filter-pill ${
                  state.paperCat === cat ? "active" : ""
                }" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)} <span class="cat-count">${count}</span></button>`
            )
            .join("")}
        </div>

        <div class="results-bar" id="paper-results-bar"></div>
        <div class="pub-list" id="paper-list-container"></div>
        <div class="load-more-wrap" id="paper-load-more"></div>
      `;

      function updatePaperList() {
        const q = state.paperQuery.trim().toLowerCase();
        const filtered = scoped.filter((p) => {
          const matchYear = state.paperYear === "全部" || p.year === state.paperYear;
          const catsToCheck = state.paperScope === "priority" && p.priDir ? [p.priDir, ...(p.cats || [])] : p.cats || [];
          const matchCat = state.paperCat === "全部" || catsToCheck.includes(state.paperCat);
          const matchQuery =
            !q ||
            (p.short || "").toLowerCase().includes(q) ||
            (p.title || "").toLowerCase().includes(q) ||
            (p.arxiv || "").toLowerCase().includes(q) ||
            (p.stage || "").toLowerCase().includes(q) ||
            (p.entryType || "").toLowerCase().includes(q) ||
            (p.method || "").toLowerCase().includes(q) ||
            (p.notes || "").toLowerCase().includes(q) ||
            (p.cats || []).join(" ").toLowerCase().includes(q);
          return matchYear && matchCat && matchQuery;
        });

        const visible = filtered.slice(0, state.paperLimit);
        const barEl = document.getElementById("paper-results-bar");
        const listEl = document.getElementById("paper-list-container");
        const moreEl = document.getElementById("paper-load-more");

        barEl.innerHTML = `<span>当前匹配 ${filtered.length} 篇 · 已展示 ${visible.length} 篇</span><span>按优先度与首投时间排序</span>`;

        if (!filtered.length) {
          listEl.innerHTML = `<div class="empty-state">没有找到符合条件的论文，试试清空搜索词或切换方向标签。</div>`;
          moreEl.innerHTML = "";
          return;
        }

        listEl.innerHTML = visible.map(renderCollectionPaperCard).join("");
        bindPaperCollectionActions();

        if (filtered.length > visible.length) {
          const remaining = filtered.length - visible.length;
          moreEl.innerHTML = `<button type="button" class="btn btn-secondary" id="load-more-papers-btn">加载更多论文（剩余 ${remaining} 篇）</button>`;
          document.getElementById("load-more-papers-btn").addEventListener("click", () => {
            state.paperLimit += 40;
            updatePaperList();
          });
        } else {
          moreEl.innerHTML = "";
        }
      }

      document.getElementById("paper-year-filters").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-year]");
        if (!btn) return;
        state.paperYear = btn.dataset.year;
        state.paperLimit = 30;
        document
          .querySelectorAll("#paper-year-filters .filter-pill")
          .forEach((b) => b.classList.toggle("active", b === btn));
        updatePaperList();
      });

      document.getElementById("paper-cat-filters").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-cat]");
        if (!btn) return;
        state.paperCat = btn.dataset.cat;
        state.paperLimit = 30;
        document
          .querySelectorAll("#paper-cat-filters .filter-pill")
          .forEach((b) => b.classList.toggle("active", b === btn));
        updatePaperList();
      });

      document.getElementById("paper-search").addEventListener("input", (e) => {
        state.paperQuery = e.target.value;
        state.paperLimit = 30;
        updatePaperList();
      });

      updatePaperList();
    }

    document.getElementById("paper-scope-tabs").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-scope]");
      if (!btn) return;
      state.paperScope = btn.dataset.scope;
      state.paperLimit = 30;
      document
        .querySelectorAll("#paper-scope-tabs .scope-tab")
        .forEach((b) => b.classList.toggle("active", b === btn));
      renderScopeBody();
    });

    renderScopeBody();
  }

  function renderBlogList() {
    const categories = ["全部", ...Array.from(new Set(POSTS.map((p) => p.category)))];

    appEl.innerHTML = `
      <div class="container view-fade">
        <div class="section-header">
          <div>
            <div class="eyebrow">ESSAYS & FIELD NOTES</div>
            <h1 class="section-title" style="font-size:2.15rem;">个人博客</h1>
            <p class="section-sub">关于算法研究、工具打磨、思考随笔与阅读笔记的长文归档。</p>
          </div>
        </div>

        <div class="filter-toolbar">
          <div class="filter-pills" id="blog-cat-filters">
            ${categories
              .map(
                (c) =>
                  `<button type="button" class="filter-pill ${state.blogTag === c ? "active" : ""}" data-cat="${escapeHtml(
                    c
                  )}">${escapeHtml(c)}</button>`
              )
              .join("")}
          </div>
          <input
            type="search"
            id="blog-search"
            class="search-input"
            placeholder="搜索文章标题或关键词..."
            value="${escapeHtml(state.blogQuery)}"
          />
        </div>

        <div class="cards-grid-2" id="blog-grid"></div>
      </div>
    `;

    function updateBlogGrid() {
      const q = state.blogQuery.trim().toLowerCase();
      const filtered = POSTS.filter((post) => {
        const matchCat = state.blogTag === "全部" || post.category === state.blogTag;
        const matchQ =
          !q ||
          post.title.toLowerCase().includes(q) ||
          post.subtitle.toLowerCase().includes(q) ||
          (post.tags || []).join(" ").toLowerCase().includes(q) ||
          post.content.toLowerCase().includes(q);
        return matchCat && matchQ;
      });

      const grid = document.getElementById("blog-grid");
      if (!filtered.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">没有匹配的文章，换个关键词试试看。</div>`;
        return;
      }
      grid.innerHTML = filtered.map(renderPostCard).join("");
      bindPostCardClicks();
    }

    document.getElementById("blog-cat-filters").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      state.blogTag = btn.dataset.cat;
      document
        .querySelectorAll("#blog-cat-filters .filter-pill")
        .forEach((b) => b.classList.toggle("active", b === btn));
      updateBlogGrid();
    });

    document.getElementById("blog-search").addEventListener("input", (e) => {
      state.blogQuery = e.target.value;
      updateBlogGrid();
    });

    updateBlogGrid();
  }

  function renderBlogDetail(slug) {
    const idx = POSTS.findIndex((p) => p.slug === slug);
    if (idx === -1) {
      renderBlogList();
      return;
    }

    const post = POSTS[idx];
    const prevPost = idx > 0 ? POSTS[idx - 1] : null;
    const nextPost = idx < POSTS.length - 1 ? POSTS[idx + 1] : null;

    appEl.innerHTML = `
      <div class="container view-fade">
        <article class="article-wrap">
          <a href="#blog" class="article-back">← 返回博客列表</a>

          <header class="article-header">
            <div class="post-card-meta">
              <span class="pill pill-sage">${escapeHtml(post.category)}</span>
              <span>${escapeHtml(post.date)}</span>
              <span>·</span>
              <span>${escapeHtml(post.readTime)}</span>
            </div>
            <h1 class="article-title">${escapeHtml(post.title)}</h1>
            <p class="article-subtitle">${escapeHtml(post.subtitle)}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${(post.tags || []).map((t) => `<span class="pill">#${escapeHtml(t)}</span>`).join("")}
            </div>
          </header>

          <div class="article-body">
            ${window.renderMarkdown(post.content)}
          </div>

          <nav class="article-nav" aria-label="相邻文章">
            <div>
              ${
                prevPost
                  ? `<a class="article-nav-card" href="#blog/${escapeHtml(prevPost.slug)}">
                      <span class="article-nav-label">← 上一篇</span>
                      <strong>${escapeHtml(prevPost.title)}</strong>
                    </a>`
                  : ""
              }
            </div>
            <div>
              ${
                nextPost
                  ? `<a class="article-nav-card" href="#blog/${escapeHtml(nextPost.slug)}" style="text-align:right;">
                      <span class="article-nav-label">下一篇 →</span>
                      <strong>${escapeHtml(nextPost.title)}</strong>
                    </a>`
                  : ""
              }
            </div>
          </nav>
        </article>
      </div>
    `;
  }

  /* ---------- Interactive Bindings ---------- */
  function bindPaperCollectionActions() {
    document.querySelectorAll(".js-copy-arxiv").forEach((btn) => {
      btn.addEventListener("click", () => {
        copyText(btn.dataset.arxiv, `已复制 arXiv ID: ${btn.dataset.arxiv}`);
      });
    });

    document.querySelectorAll(".js-copy-paper-bib").forEach((btn) => {
      btn.addEventListener("click", () => {
        const paper = (COLLECTION.papers || []).find((p) => p.id === btn.dataset.id);
        if (paper) copyText(buildBibtex(paper), "已复制 BibTeX 引用到剪贴板");
      });
    });
  }

  function bindPostCardClicks() {
    document.querySelectorAll(".js-open-post").forEach((card) => {
      card.addEventListener("click", () => {
        window.location.hash = `#blog/${card.dataset.slug}`;
      });
    });
  }

  /* ---------- Router ---------- */
  function updateReadingProgress() {
    const isArticle = window.location.hash.startsWith("#blog/");
    if (!isArticle) {
      progressBar.style.width = "0";
      return;
    }
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    progressBar.style.width = `${pct}%`;
  }

  function route() {
    const rawHash = (window.location.hash || "#home").replace(/^#/, "");
    const [section, param] = rawHash.split("/");
    const activeSection = ["home", "cv", "papers", "blog"].includes(section) ? section : "home";

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === activeSection);
    });

    if (activeSection === "home") renderHome();
    else if (activeSection === "cv") renderCV();
    else if (activeSection === "papers") renderPapers();
    else if (activeSection === "blog" && param) renderBlogDetail(param);
    else if (activeSection === "blog") renderBlogList();

    window.scrollTo({ top: 0, behavior: "instant" });
    updateReadingProgress();
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("scroll", updateReadingProgress, { passive: true });

  initTheme();
  initCosmosCanvas();
  initMobileNav();
  hydrateShell();
  route();
})();
