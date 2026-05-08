# AI Markdown Viewer

A zen-inspired, high-performance Chrome extension for viewing local Markdown files with beautiful rendering, collapsible TOC, and multiple skins.

一款禅意风格的高性能 Chrome 扩展，用于本地 Markdown 文件的优雅阅读，支持可折叠目录、多种皮肤和暗色模式。

---

## Features | 功能特性

- **Beautiful Rendering** — Typora-quality display with code highlighting (20+ languages)
- **3 Skins** — Paper (素纸), Grid (方格本), Minimal (极简)
- **Dark/Light Theme** — Auto-detection + manual toggle, persisted
- **Collapsible TOC** — Right sidebar, default 2-level expansion, scroll sync
- **Settings Panel** — Zoom, TOC depth, font family (system/serif/mono)
- **Folder Browsing** — Open entire folders via File System Access API
- **Local Images** — Relative image paths automatically resolved
- **Performance** — Tree-shaken highlight.js, IntersectionObserver

---

## Installation | 安装教程

### Prerequisites | 前置要求

- Node.js 18+
- npm

### Build | 构建

```bash
git clone https://github.com/beanseedling629-hash/aiMarkdown.git
cd aiMarkdown
npm install
npm run build
```

### Install to Chrome | 安装到 Chrome

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `dist/` folder
4. Click the extension's **Details** → enable **Allow access to file URLs**

---

1. 在 Chrome 中打开 `chrome://extensions/`
2. 右上角开启 **开发者模式**
3. 点击 **加载已解压的扩展程序** → 选择 `dist/` 文件夹
4. 点击扩展的 **详情** → 开启 **允许访问文件网址**

---

## Usage | 使用方式

### Single File Mode | 单文件模式

Double-click any `.md` file → Chrome opens it → auto-renders with TOC.

双击任意 `.md` 文件 → Chrome 打开 → 自动渲染并显示目录。

### Folder Mode | 文件夹模式

Click the extension icon → "Open Folder" → browse all Markdown files.

点击扩展图标 → "Open Folder" → 浏览文件夹内所有 Markdown 文件。

### Settings | 设置

Click the ⚙️ icon in the top-right floating bubble:

点击右上角浮动气泡中的 ⚙️ 图标：

| Setting | Range | Default |
|---------|-------|---------|
| Zoom | 75% ~ 150% | 100% |
| TOC Depth | 1 ~ 6 levels | 2 |
| Font | System / Serif / Mono | System |

### Skins | 皮肤

Click the skin icon to cycle through:

| Skin | Style |
|------|-------|
| 📜 Paper (素纸) | Warm parchment, serif headings, centered h1 |
| 📓 Grid (方格) | Notebook grid background, skeuomorphic TOC |
| ◻ Minimal (极简) | Pure white, no decoration |

---

## Tech Stack | 技术栈

- **Vite** + **TypeScript** (multi-config build)
- **markdown-it** + plugins (anchor, task lists)
- **highlight.js** — Selective language loading (20+ languages)
- **Chrome Extension MV3** — Content Script (IIFE) + Background SW

---

## Development | 开发

```bash
# Install dependencies
npm install

# Build for production (outputs to dist/)
npm run build

# The build runs 3 steps:
# 1. Vite build (popup + viewer HTML pages)
# 2. Vite build (content script as IIFE)
# 3. Vite build (background service worker)
# 4. Post-process script (fix paths + copy assets)
```

---

## Project Structure | 项目结构

```
src/
├── content/           # Content Script (injected on file://*.md)
│   └── index.ts       # Full UI: render, TOC, skins, settings
├── core/              # Shared modules
│   ├── renderer.ts    # markdown-it + highlight.js config
│   ├── toc.ts         # Collapsible TOC builder
│   ├── theme.ts       # Theme/skin/settings management
│   ├── scroll-sync.ts # IntersectionObserver + TOC scroll
│   └── image-resolver.ts # Local image path resolution
├── background/        # Service Worker
│   └── index.ts       # Message handler
└── viewer/            # Folder browser
    ├── index.html     # Viewer page
    ├── viewer.ts      # File System Access API
    ├── popup.html     # Extension popup
    └── popup.ts       # Popup script
```

---

## License

MIT
