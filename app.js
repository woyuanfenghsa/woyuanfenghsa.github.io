/**
 * ============================================================
 * 主应用逻辑与路由 (js/app.js)
 * ============================================================
 */

(function () {
  const DATA = window.SITE_DATA;
  const POSTS = window.BLOG_POSTS || [];
  const appEl = document.getElementById("app");
  const progressBar = document.getElementById("reading-progress");
  const toastEl = document.getElementById("toast");

  const state = {
    paperYear: "全部",
    paperTag: "全部",
    paperQuery: "",
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

  /* ---------- Theme Initialization ---------- */
  function initTheme() {
    const saved = localStorage.getItem("editorial-site-theme");
    const theme = saved || "light";
    document.documentElement.setAttribute("data-theme", theme);

    document.getElementById("theme-toggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("editorial-site-theme", next);
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
    document.title = `${profile.name} · 个人主页、简历、论文与博客`;
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

  /* ---------- Helper Renderers ---------- */
  function formatAuthors(authors, selfName) {
    return authors
      .map((a) => {
        const clean = escapeHtml(a);
        if (selfName && a.includes(selfName)) {
          return `<span class="author-self">${clean}</span>`;
        }
        return clean;
      })
      .join(", ");
  }

  function renderPublicationCard(pub) {
    const linkButtons = [];
    if (pub.links?.pdf) {
      linkButtons.push(
        `<a class="btn btn-ghost" href="${escapeHtml(pub.links.pdf)}" target="_blank" rel="noopener noreferrer">PDF ↗</a>`
      );
    }
    if (pub.links?.code) {
      linkButtons.push(
        `<a class="btn btn-ghost" href="${escapeHtml(pub.links.code)}" target="_blank" rel="noopener noreferrer">Code ↗</a>`
      );
    }
    if (pub.links?.project) {
      const isHash = pub.links.project.startsWith("#");
      linkButtons.push(
        `<a class="btn btn-ghost" href="${escapeHtml(pub.links.project)}" ${
          isHash ? "" : 'target="_blank" rel="noopener noreferrer"'
        }>Project</a>`
      );
    }

    const tagsHtml = (pub.tags || [])
      .map((t) => `<span class="pill">${escapeHtml(t)}</span>`)
      .join("");

    return `
      <article class="card pub-card" data-pub-id="${escapeHtml(pub.id)}">
        <div class="pub-meta-top">
          <span class="pill pill-accent">${escapeHtml(pub.venue)}</span>
          <span class="pill pill-sage">${escapeHtml(pub.year)}</span>
          ${pub.note ? `<span class="pub-note">${escapeHtml(pub.note)}</span>` : ""}
        </div>
        <h3 class="pub-title">${escapeHtml(pub.title)}</h3>
        <p class="pub-authors">${formatAuthors(pub.authors, pub.highlightAuthor)}</p>
        <div class="pub-actions">
          ${linkButtons.join("")}
          <button type="button" class="btn btn-ghost js-toggle-abstract" data-id="${escapeHtml(pub.id)}">摘要</button>
          <button type="button" class="btn btn-ghost js-toggle-bib" data-id="${escapeHtml(pub.id)}">BibTeX</button>
          <span style="flex:1"></span>
          ${tagsHtml}
        </div>
        <div class="pub-drawer hidden" id="abs-${escapeHtml(pub.id)}">
          <strong>论文摘要：</strong>${escapeHtml(pub.abstract)}
        </div>
        <div class="pub-drawer bibtex-box hidden" id="bib-${escapeHtml(pub.id)}">
          <div class="bibtex-copy-row">
            <span>BIBTEX CITATION</span>
            <button type="button" class="btn btn-ghost js-copy-bib" data-id="${escapeHtml(pub.id)}">一键复制</button>
          </div>
          <pre><code>${escapeHtml(pub.bibtex)}</code></pre>
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
    const { profile, news, publications } = DATA;
    const featuredPubs = publications.filter((p) => p.featured).slice(0, 3);
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
              <a href="#papers" class="btn btn-secondary">论文发表 (${publications.length})</a>
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
            <img src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.name)} 头像" />
            <div class="portrait-caption">
              <span>${escapeHtml(profile.location)}</span>
              <span>${escapeHtml(profile.initials)}</span>
            </div>
          </aside>
        </section>

        <section class="editorial-two-col">
          <div class="about-text">
            <div class="eyebrow">ABOUT ME</div>
            <h2 class="section-title" style="margin-bottom:16px;">关于我与研究方向</h2>
            ${profile.bioParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
            <div class="interest-list">
              ${profile.interests.map((item) => `<span class="pill pill-sage">${escapeHtml(item)}</span>`).join("")}
            </div>
          </div>

          <aside class="news-panel">
            <h3>近期动态 · News</h3>
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
              <div class="eyebrow">SELECTED PUBLICATIONS</div>
              <h2 class="section-title">精选论文</h2>
            </div>
            <a href="#papers" class="btn btn-ghost">查看全部论文 →</a>
          </div>
          <div class="pub-list">
            ${featuredPubs.map(renderPublicationCard).join("")}
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

    bindPublicationInteractions();
    bindPostCardClicks();
  }

  function renderCV() {
    const { profile, cv } = DATA;
    appEl.innerHTML = `
      <div class="container view-fade">
        <div class="cv-banner">
          <div>
            <div class="eyebrow">CURRICULUM VITAE</div>
            <h1 class="section-title" style="font-size:2.1rem;">${escapeHtml(profile.name)} · 个人简历</h1>
            <p class="section-sub">${escapeHtml(profile.role)} · ${escapeHtml(profile.affiliation)} · ${escapeHtml(
      profile.email
    )}</p>
          </div>
          <div class="no-print" style="display:flex;gap:10px;">
            <button type="button" class="btn btn-primary" id="print-cv-btn">导出 / 打印 PDF</button>
            <a href="#papers" class="btn btn-secondary">完整论文列表</a>
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
    const pubs = DATA.publications;
    const years = ["全部", ...Array.from(new Set(pubs.map((p) => String(p.year)))).sort((a, b) => b - a)];
    const allTags = ["全部", ...Array.from(new Set(pubs.flatMap((p) => p.tags || [])))];
    const firstAuthorCount = pubs.filter(
      (p) => p.authors[0] && p.authors[0].includes(p.highlightAuthor)
    ).length;
    const openSourceCount = pubs.filter((p) => p.links && p.links.code).length;

    appEl.innerHTML = `
      <div class="container view-fade">
        <div class="section-header">
          <div>
            <div class="eyebrow">PUBLICATIONS & PREPRINTS</div>
            <h1 class="section-title" style="font-size:2.1rem;">论文发表</h1>
            <p class="section-sub">支持按年份、主题与关键词筛选，每篇论文均提供摘要与一键复制 BibTeX。</p>
          </div>
        </div>

        <div class="stats-strip">
          <div class="stat-box">
            <div class="stat-num">${pubs.length}</div>
            <div class="stat-label">已收录论文与预印本</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${firstAuthorCount}</div>
            <div class="stat-label">第一作者 / 共同一作</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${openSourceCount}</div>
            <div class="stat-label">附带开源代码仓库</div>
          </div>
        </div>

        <div class="filter-toolbar">
          <div class="filter-pills" id="paper-year-filters">
            ${years
              .map(
                (y) =>
                  `<button type="button" class="filter-pill ${state.paperYear === y ? "active" : ""}" data-year="${escapeHtml(
                    y
                  )}">${escapeHtml(y)}</button>`
              )
              .join("")}
          </div>
          <input
            type="search"
            id="paper-search"
            class="search-input"
            placeholder="搜索标题、会议、作者..."
            value="${escapeHtml(state.paperQuery)}"
          />
        </div>

        <div class="filter-pills" id="paper-tag-filters" style="margin-bottom:24px;">
          ${allTags
            .map(
              (t) =>
                `<button type="button" class="filter-pill ${state.paperTag === t ? "active" : ""}" data-tag="${escapeHtml(
                  t
                )}">${t === "全部" ? "全部主题" : "#" + escapeHtml(t)}</button>`
            )
            .join("")}
        </div>

        <div class="pub-list" id="paper-list-container"></div>
      </div>
    `;

    function updatePaperList() {
      const q = state.paperQuery.trim().toLowerCase();
      const filtered = pubs.filter((p) => {
        const matchYear = state.paperYear === "全部" || String(p.year) === state.paperYear;
        const matchTag = state.paperTag === "全部" || (p.tags || []).includes(state.paperTag);
        const matchQuery =
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.venue.toLowerCase().includes(q) ||
          p.authors.join(" ").toLowerCase().includes(q) ||
          (p.abstract || "").toLowerCase().includes(q);
        return matchYear && matchTag && matchQuery;
      });

      const listEl = document.getElementById("paper-list-container");
      if (!filtered.length) {
        listEl.innerHTML = `<div class="empty-state">没有找到符合条件的论文，试试切换筛选标签吧。</div>`;
        return;
      }
      listEl.innerHTML = filtered.map(renderPublicationCard).join("");
      bindPublicationInteractions();
    }

    document.getElementById("paper-year-filters").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-year]");
      if (!btn) return;
      state.paperYear = btn.dataset.year;
      document
        .querySelectorAll("#paper-year-filters .filter-pill")
        .forEach((b) => b.classList.toggle("active", b === btn));
      updatePaperList();
    });

    document.getElementById("paper-tag-filters").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tag]");
      if (!btn) return;
      state.paperTag = btn.dataset.tag;
      document
        .querySelectorAll("#paper-tag-filters .filter-pill")
        .forEach((b) => b.classList.toggle("active", b === btn));
      updatePaperList();
    });

    document.getElementById("paper-search").addEventListener("input", (e) => {
      state.paperQuery = e.target.value;
      updatePaperList();
    });

    updatePaperList();
  }

  function renderBlogList() {
    const categories = ["全部", ...Array.from(new Set(POSTS.map((p) => p.category)))];

    appEl.innerHTML = `
      <div class="container view-fade">
        <div class="section-header">
          <div>
            <div class="eyebrow">ESSAYS & FIELD NOTES</div>
            <h1 class="section-title" style="font-size:2.1rem;">个人博客</h1>
            <p class="section-sub">关于算法研究、工具打磨、排版设计与阅读笔记的长文归档。</p>
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
  function bindPublicationInteractions() {
    document.querySelectorAll(".js-toggle-abstract").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el = document.getElementById(`abs-${btn.dataset.id}`);
        if (el) el.classList.toggle("hidden");
      });
    });

    document.querySelectorAll(".js-toggle-bib").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el = document.getElementById(`bib-${btn.dataset.id}`);
        if (el) el.classList.toggle("hidden");
      });
    });

    document.querySelectorAll(".js-copy-bib").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pub = DATA.publications.find((p) => p.id === btn.dataset.id);
        if (pub) copyText(pub.bibtex, "已复制 BibTeX 引用到剪贴板");
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
  initMobileNav();
  hydrateShell();
  route();
})();
