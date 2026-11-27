/**
 * ============================================================
 * 个人网站核心配置文件 (site-data.js)
 * ============================================================
 * 修改此文件即可一键更新你的个人资料、简历、论文与社交链接。
 * 如需更换头像，请将你的照片上传到仓库根目录，并修改 profile.avatar。
 */

window.SITE_DATA = {
  profile: {
    name: "刘哲维",
    englishName: "Zhewei Liu",
    initials: "Z. Liu",
    issueLabel: "STARS · FLAME · POLAR DAY · 个人星图与研究档案",
    role: "机器学习研究者 · 全栈工程师",
    affiliation: "某大学 / 实验室 · 北京",
    location: "中国 · 北京",
    email: "hello@example.com",
    avatar: "avatar.svg",
    tagline: "在严谨的算法研究与温暖的日常表达之间，持续记录代码、论文与慢思考。",
    bioParagraphs: [
      "你好，欢迎来到我的个人主页。这里既是我整理学术论文与工程履历的档案室，也是记录技术笔记、阅读摘录与生活随笔的公开笔记本。",
      "我主要关注多模态表征学习、高效推理系统以及以人为中心的交互工具设计。我相信好的研究不仅停留在指标曲线上，也应该通过清晰的写作与开源代码被更多人理解和复现。"
    ],
    interests: [
      "图像与视频强化学习",
      "少步蒸馏与加速",
      "图像与视频编辑",
      "迁色与打光",
      "世界模型与生成视觉"
    ],
    socials: [
      { label: "GitHub", url: "https://github.com/woyuanfenghsa", icon: "github" },
      { label: "Google Scholar", url: "https://scholar.google.com", icon: "scholar" },
      { label: "Email", url: "mailto:hello@example.com", icon: "mail" },
      { label: "ORCID", url: "https://orcid.org", icon: "orcid" }
    ],
    footerNote: "向星辰发问，以炽焰求索，在极昼的光晕里持续写作。"
  },

  /** 首页动态时间线 */
  news: [
    {
      date: "2026.11",
      tag: "论文库",
      text: "完成 11.20–11.27 生成视觉论文增量入库（+59 篇，含 DiffusionART、SPM、DexOPD、iTDM、CCR 等），总收录达 765 篇。"
    },
    {
      date: "2026.10",
      tag: "论文",
      text: "一篇关于轻量级多模态对齐的新工作已上线 arXiv，代码与评测基准同步开源。"
    },
    {
      date: "2026.07",
      tag: "博客",
      text: "发布新随笔《把科研实验做成一件趁手的器物》，总结两年来的实验管理习惯。"
    },
    {
      date: "2025.09",
      tag: "录用",
      text: "论文《Context-Aware Visual Token Pruning...》被 NeurIPS 2025 录用为 Poster。"
    },
    {
      date: "2025.05",
      tag: "开源",
      text: "发布轻量级学术笔记与 BibTeX 整理工具，在 GitHub 获得 300+ Stars。"
    }
  ],

  /** 个人简历 (CV / Resume) */
  cv: {
    summary:
      "拥有 4 年以上深度学习与系统工程经验，熟悉从问题建模、大规模训练优化到端侧推理部署的完整链路；发表多篇顶会论文，并持续维护多个高质量开源项目。",
    education: [
      {
        period: "2023.09 — 至今",
        degree: "计算机科学与技术 · 博士研究生（示例）",
        institution: "示例大学 · 智能计算实验室",
        location: "北京",
        details: [
          "研究方向：多模态大语言模型、视觉 Token 压缩与长上下文高效推理。",
          "担任研究生课程《机器学习系统实践》助教，指导 3 名本科生完成毕业设计。"
        ]
      },
      {
        period: "2019.09 — 2023.06",
        degree: "软件工程 · 工学学士（示例）",
        institution: "示例大学 · 计算机学院",
        location: "上海",
        details: [
          "GPA 3.92 / 4.0（专业前 3%），优秀本科毕业论文获得者。",
          "核心课程：数据结构与算法、操作系统、深度学习基础、编译原理。"
        ]
      }
    ],
    experience: [
      {
        period: "2025.06 — 2025.11",
        title: "研究实习生 · 多模态基础模型组",
        organization: "示例人工智能研究院",
        location: "北京",
        details: [
          "设计动态视觉 Token 稀疏路由框架，在保持 99.1% 基准准确率的前提下将推理显存降低 38%。",
          "主导评测流水线重构，将跨 12 个视觉问答基准的全量评测耗时从 9 小时缩短至 1.8 小时。"
        ]
      },
      {
        period: "2024.03 — 2024.09",
        title: "算法工程实习生 · 推理加速团队",
        organization: "示例科技公司",
        location: "深圳",
        details: [
          "参与基于 Triton 的自定义注意力算子优化，在长序列输入场景下实现 1.45× 端到端吞吐提升。",
          "构建自动化回归测试与可视化 Profiling 看板，服务团队内 20+ 名研发人员。"
        ]
      }
    ],
    projects: [
      {
        period: "2025 — 至今",
        name: "PrismBench · 多模态长文档评测工具链",
        role: "作者与核心维护者",
        link: "https://github.com",
        description:
          "面向论文复现的一站式评测脚本库，内置统一数据加载器、缓存管理与 LaTeX 表格自动导出，支持 15+ 常见视觉-语言基准。"
      },
      {
        period: "2024 — 2025",
        name: "AtelierNotes · 极简科研卡片与文献库",
        role: "独立开发",
        link: "https://github.com",
        description:
          "结合 Markdown 与 BibTeX 的本地优先知识管理工具，帮助研究者在阅读论文时快速建立双向引用与实验灵感卡片。"
      }
    ],
    skills: [
      {
        category: "研究与机器学习",
        items: ["PyTorch", "Hugging Face", "Triton", "DeepSpeed", "vLLM", "多模态对齐", "模型压缩"]
      },
      {
        category: "编程语言",
        items: ["Python", "TypeScript / JavaScript", "C++", "CUDA", "Bash", "SQL"]
      },
      {
        category: "工程与写作工具",
        items: ["Linux", "Docker", "Git & GitHub Actions", "LaTeX", "Weights & Biases", "Figma"]
      }
    ],
    awards: [
      { year: "2026", title: "国家奖学金（博士生）", issuer: "教育部" },
      { year: "2025", title: "NeurIPS Top Reviewer", issuer: "NeurIPS 2025 组委会" },
      { year: "2024", title: "学术创新一等奖学金", issuer: "示例大学" },
      { year: "2023", title: "优秀本科毕业生", issuer: "示例大学" }
    ]
  },

  /** 论文发表 (Publications) */
  publications: [
    {
      id: "liu2026folio",
      title: "FolioVLM: Structure-Preserving Visual Compression for Long-Document Understanding",
      authors: ["Zhewei Liu*", "Mingyue Chen*", "Hao Zhang", "Minghao Wang"],
      highlightAuthor: "Zhewei Liu",
      venue: "arXiv Preprint",
      venueType: "Preprint",
      year: 2026,
      featured: true,
      tags: ["多模态", "高效推理", "文档理解"],
      note: "Equal contribution (*)",
      abstract:
        "多页学术文档与杂志排版图像通常包含高密度文字与复杂图表结构，直接输入高分辨率图像会导致视觉 Token 数量急剧膨胀。本文提出 FolioVLM，一种面向版面结构感知的分层视觉压缩机制：在保留细粒度文字区域的同时对冗余背景进行自适应合并，在 DocVQA、MMLongBench 等长文档基准上以 42% 的视觉 Token 预算达到超越全量 Token 基线的表现。",
      links: {
        pdf: "https://arxiv.org",
        code: "https://github.com/woyuanfenghsa",
        project: "#home"
      },
      bibtex: `@article{liu2026foliovlm,
  title   = {FolioVLM: Structure-Preserving Visual Compression for Long-Document Understanding},
  author  = {Liu, Zhewei and Chen, Mingyue and Zhang, Hao and Wang, Minghao},
  journal = {arXiv preprint arXiv:2610.01234},
  year    = {2026}
}`
    },
    {
      id: "liu2025pruning",
      title: "Context-Aware Visual Token Pruning without Retraining for Multimodal LLMs",
      authors: ["Zhewei Liu", "Yifan Zhou", "Qian Wu", "Minghao Wang"],
      highlightAuthor: "Zhewei Liu",
      venue: "NeurIPS 2025",
      venueType: "Conference",
      year: 2025,
      featured: true,
      tags: ["多模态", "高效推理"],
      note: "Poster · Top 15%",
      abstract:
        "现有免训练视觉 Token 剪枝方法多依赖浅层静态注意力分数，容易在复杂推理问题中误删关键细节。我们分析跨层注意力迁移模式，提出基于问题语义引导的上下文剪枝策略，无需任何微调即可即插即用于主流多模态大模型，在 2× 推理加速下将平均性能损失控制在 0.4% 以内。",
      links: {
        pdf: "https://arxiv.org",
        code: "https://github.com/woyuanfenghsa"
      },
      bibtex: `@inproceedings{liu2025context,
  title     = {Context-Aware Visual Token Pruning without Retraining for Multimodal LLMs},
  author    = {Liu, Zhewei and Zhou, Yifan and Wu, Qian and Wang, Minghao},
  booktitle = {Advances in Neural Information Processing Systems (NeurIPS)},
  year      = {2025}
}`
    },
    {
      id: "chen2025repro",
      title: "Towards Transparent Evaluation in Vision-Language Benchmarks: Pitfalls and Best Practices",
      authors: ["Mingyue Chen", "Zhewei Liu", "Shuai Wang"],
      highlightAuthor: "Zhewei Liu",
      venue: "ACL 2025 Findings",
      venueType: "Conference",
      year: 2025,
      featured: true,
      tags: ["评测与复现", "多模态"],
      note: "Benchmark & Tooling",
      abstract:
        "我们对 14 个广泛使用的视觉-语言评测基准进行了系统性复现审计，发现提示词模板、图像缩放比例与答案解析规则的细微差异可造成高达 4.8% 的分数波动。基于此，我们提出一套标准化评测协议与开源验证工具链，促进社区结果的可比性与透明度。",
      links: {
        pdf: "https://aclanthology.org",
        code: "https://github.com/woyuanfenghsa",
        project: "#papers"
      },
      bibtex: `@inproceedings{chen2025transparent,
  title     = {Towards Transparent Evaluation in Vision-Language Benchmarks: Pitfalls and Best Practices},
  author    = {Chen, Mingyue and Liu, Zhewei and Wang, Shuai},
  booktitle = {Findings of the Association for Computational Linguistics: ACL 2025},
  year      = {2025}
}`
    },
    {
      id: "liu2024layout",
      title: "WarmLayout: Aesthetic Grid Priors for Controllable Graphic Document Synthesis",
      authors: ["Zhewei Liu", "Jiaqi Sun", "Minghao Wang"],
      highlightAuthor: "Zhewei Liu",
      venue: "CVPR 2024",
      venueType: "Conference",
      year: 2024,
      featured: false,
      tags: ["文档理解", "排版与生成"],
      note: "Highlight",
      abstract:
        "结合传统平面设计中的网格比例先验与扩散模型条件生成机制，WarmLayout 能够根据用户给定的图文素材自动生成留白均衡、层级清晰的杂志与海报版面，在人工美学盲测中获得显著更高的可读性与视觉舒适度评分。",
      links: {
        pdf: "https://openaccess.thecvf.com",
        code: "https://github.com/woyuanfenghsa"
      },
      bibtex: `@inproceedings{liu2024warmlayout,
  title     = {WarmLayout: Aesthetic Grid Priors for Controllable Graphic Document Synthesis},
  author    = {Liu, Zhewei and Sun, Jiaqi and Wang, Minghao},
  booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)},
  year      = {2024}
}`
    }
  ]
};
