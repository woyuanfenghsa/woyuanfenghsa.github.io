# 个人学术与博客网站（GitHub Pages）

访问地址：**https://woyuanfenghsa.github.io/**

一个**清新温暖、杂志排版质感**的纯静态个人网站，专为 GitHub Pages 打造，无需任何打包或构建工具，支持直接在 GitHub 网页端编辑更新。

## 功能亮点

- **首页（Home）**：杂志封面感个人简介、研究兴趣标签、动态时间线、精选论文与最新随笔速览
- **个人简历（CV / Resume）**：教育背景、工作/科研经历、代表项目、技能分组、荣誉奖项，支持**一键导出 / 打印 A4 PDF 简历**
- **论文发表（Publications）**：支持按年份、主题与关键词筛选，每篇论文可展开摘要、**一键复制 BibTeX**
- **个人博客（Blog）**：支持标准 Markdown 写作、分类与全文搜索、沉浸式长文阅读与顶部阅读进度条
- **暖色明暗主题切换**：柔和米白纸感浅色模式 + 温润深炭夜间模式，自动记住偏好

## 文件说明

```text
├── index.html      # 主入口页面
├── site-data.js    # 个人信息、简历、论文与 BibTeX（最常修改）
├── posts.js        # 博客文章库（Markdown 格式，最常修改）
├── style.css       # 温暖杂志风样式与 A4 打印样式表
├── app.js          # 页面路由与交互逻辑
├── markdown.js     # 零依赖 Markdown 渲染器
├── avatar.svg      # 默认插画头像（可替换为你的照片）
└── .nojekyll       # 告诉 GitHub Pages 直接发布静态文件
```

## 如何更新内容（两种方式）

### 方式一：直接在 GitHub 网页修改（最省事）
1. 修改个人简介、简历与论文：点击仓库里的 `site-data.js` → 右上角铅笔图标编辑 → 点击 **Commit changes**。
2. 发布新博客：点击 `posts.js` → 在数组开头新增一篇 Markdown 对象 → **Commit changes**。
3. 更换头像：上传你的照片（例如 `avatar.jpg`）到仓库根目录，然后把 `site-data.js` 中的 `avatar: "avatar.svg"` 改为 `"avatar.jpg"`。

### 方式二：本地修改后 `git push`
```bash
git add .
git commit -m "Update personal site content"
git push
```

提交后等待约 1–2 分钟，GitHub Pages 会自动更新 `https://woyuanfenghsa.github.io/`。
