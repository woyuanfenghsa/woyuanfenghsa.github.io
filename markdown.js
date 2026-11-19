/**
 * 轻量级零依赖 Markdown 渲染器 (js/markdown.js)
 * 支持：标题、段落、粗体/斜体、行内代码、代码块、引用、无序/有序列表、表格、分割线、链接。
 */

(function () {
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderInline(text) {
    let out = escapeHtml(text);

    // Inline code first (protect content inside backticks)
    const codeSpans = [];
    out = out.replace(/`([^`]+)`/g, (_, code) => {
      const idx = codeSpans.length;
      codeSpans.push(`<code>${code}</code>`);
      return `\u0000CODE${idx}\u0000`;
    });

    // Links [text](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      const safeUrl = /^(https?:|mailto:|#|\/)/i.test(url.trim()) ? url.trim() : "#";
      const external = /^https?:/i.test(safeUrl) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${safeUrl}"${external}>${label}</a>`;
    });

    // Bold & Italic
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Line break (two trailing spaces)
    out = out.replace(/  \n/g, "<br />");

    // Restore code spans
    out = out.replace(/\u0000CODE(\d+)\u0000/g, (_, idx) => codeSpans[Number(idx)]);

    return out;
  }

  function parseTable(lines) {
    if (lines.length < 2) return null;
    const splitRow = (line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());

    const headers = splitRow(lines[0]);
    const rows = lines.slice(2).map(splitRow);

    const thead = `<thead><tr>${headers.map((h) => `<th>${renderInline(h)}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`)
      .join("")}</tbody>`;
    return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
  }

  function renderMarkdown(md) {
    if (!md) return "";
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Blank line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Fenced code block
      const fenceMatch = line.match(/^```(\w*)\s*$/);
      if (fenceMatch) {
        const lang = fenceMatch[1] || "text";
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        html.push(
          `<div class="code-block"><div class="code-block-header"><span>${escapeHtml(
            lang
          )}</span></div><pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre></div>`
        );
        continue;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        html.push(`<h${level}>${renderInline(headingMatch[2].trim())}</h${level}>`);
        i++;
        continue;
      }

      // Horizontal rule
      if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
        html.push("<hr />");
        i++;
        continue;
      }

      // Blockquote
      if (line.trim().startsWith(">")) {
        const quoteLines = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        html.push(`<blockquote><p>${renderInline(quoteLines.join("\n"))}</p></blockquote>`);
        continue;
      }

      // Table
      if (
        line.includes("|") &&
        i + 1 < lines.length &&
        /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])
      ) {
        const tableLines = [line, lines[i + 1]];
        i += 2;
        while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
          tableLines.push(lines[i]);
          i++;
        }
        const tableHtml = parseTable(tableLines);
        if (tableHtml) html.push(tableHtml);
        continue;
      }

      // Unordered list
      if (/^\s*[-*+]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
          i++;
        }
        html.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
        continue;
      }

      // Ordered list
      if (/^\s*\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
          i++;
        }
        html.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
        continue;
      }

      // Paragraph
      const paraLines = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,4}\s|```|\s*>\s?|\s*[-*+]\s+|\s*\d+\.\s+)/.test(lines[i])
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      html.push(`<p>${renderInline(paraLines.join("\n"))}</p>`);
    }

    return html.join("\n");
  }

  window.renderMarkdown = renderMarkdown;
})();
