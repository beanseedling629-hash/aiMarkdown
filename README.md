<p align="center">
  <img src="public/icon-128.png" width="80" alt="AI Markdown Viewer">
</p>

<h1 align="center">AI Markdown Viewer</h1>

<p align="center">
  <strong>Zen-inspired local Markdown reader for Chrome</strong><br>
  禅意风格的本地 Markdown 阅读器 Chrome 扩展
</p>

<p align="center">
  <a href="#installation--安装"><img src="https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white" alt="Chrome MV3"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/highlight.js-20%2B%20langs-f0db4f" alt="highlight.js">
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 **3 Skins** | Paper (素纸) · Grid (方格本) · Minimal (极简) |
| 🌗 **Dark/Light** | Auto-detection + manual toggle, persisted |
| 📑 **Collapsible TOC** | Book-tab style sidebar, scroll-synced, auto-expand |
| ⚙️ **Settings** | Zoom (75–150%), TOC depth (1–6), Font family |
| 🖊️ **Code Highlight** | 20+ languages with theme-aware colors |
| 📁 **Folder Mode** | Browse `.md` files via File System Access API |
| 🖼️ **Local Images** | Relative paths auto-resolved |
| ⚡ **Performance** | Tree-shaken, IIFE content script, IntersectionObserver |

---

## 📸 Screenshots

> 💡 Open any `.md` file with Chrome — it renders instantly.

<!--
TODO: Add screenshots here
![Light Mode](docs/screenshot-light.png)
![Dark Mode](docs/screenshot-dark.png)
-->

| Paper (Light) | Grid (Light) | Minimal (Dark) |
|:---:|:---:|:---:|
| Warm serif headings | Notebook grid bg | Pure & clean |

---

## 🚀 Installation | 安装

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 8

### Build from source

```bash
git clone https://github.com/beanseedling629-hash/aiMarkdown.git
cd aiMarkdown
npm install
npm run build
```

### Load into Chrome | 加载到 Chrome

<details>
<summary><strong>English</strong></summary>

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `dist/` folder
4. Open extension **Details** → enable **Allow access to file URLs**

</details>

<details open>
<summary><strong>中文</strong></summary>

1. 打开 `chrome://extensions/`
2. 右上角开启 **开发者模式**
3. 点击 **加载已解压的扩展程序** → 选择 `dist/` 文件夹
4. 进入扩展 **详情** → 开启 **允许访问文件网址**

</details>

---

## 📖 Usage | 使用

### Single File | 单文件

Double-click any `.md` file → Chrome renders it with TOC.

双击 `.md` 文件 → Chrome 自动渲染 + 右侧目录。

### Folder Browse | 文件夹浏览

Click extension icon → **Open Folder** → browse all Markdown files.

### Toolbar | 工具栏

Top-right floating bubble (hover to reveal):

| Button | Action |
|--------|--------|
| 📑 | Show/Hide TOC (with slide animation) |
| 🎨 | Cycle skins: Paper → Grid → Minimal |
| 🌙 | Toggle dark/light mode |
| ⚙️ | Open settings panel |

### Settings | 设置项

| Setting | Range | Default |
|---------|-------|---------|
| Zoom | 75% – 150% | **100%** |
| TOC Depth | 1 – 6 layers | **2** (h1 + h2) |
| Font | System / Serif / Mono | **System** |

---

## 🏗️ Tech Stack

```
Vite 6 + TypeScript 5.5      → Build toolchain
markdown-it                   → Markdown parsing (anchor, task lists)
highlight.js (selective)      → Syntax highlighting (20+ languages)
Chrome Extension MV3          → Content Script (IIFE) + Service Worker
IntersectionObserver          → Scroll-synced TOC
File System Access API        → Folder browsing
```

---

## 📂 Project Structure

```
src/
├── content/              # Content Script — injected on file://*.md
│   └── index.ts          # Full UI: skins, TOC, settings, rendering
├── core/                 # Shared modules
│   ├── renderer.ts       # markdown-it + highlight.js
│   ├── toc.ts            # Collapsible tree TOC builder
│   ├── theme.ts          # Theme / skin / settings store
│   ├── scroll-sync.ts    # IntersectionObserver + TOC scroll
│   └── image-resolver.ts # Relative image path → file:// URL
├── background/           # Service Worker
│   └── index.ts          # Message relay
└── viewer/               # Folder browser (popup + full page)
    ├── popup.html/ts     # Extension popup
    └── index.html/ts     # File System Access viewer
```

---

## 🛠️ Development

```bash
npm install          # Install dependencies
npm run build        # Production build → dist/
```

The build pipeline:
1. **Vite** → popup + viewer HTML pages
2. **Vite** (content config) → content script as self-contained IIFE
3. **Vite** (bg config) → background service worker
4. **Post-process** → fix paths, copy icons, generate manifest

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feat/amazing`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feat/amazing`)
5. Open a Pull Request

---

## 📄 License

[MIT](LICENSE) © 2024
