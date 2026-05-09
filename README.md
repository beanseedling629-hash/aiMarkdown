# AI Markdown Viewer

> A zen-inspired Chrome extension for reading — local Markdown files, web articles, and your saved reading list.

[中文文档](./README_CN.md)

## Features

| Feature | Description |
|---------|-------------|
| **Local .md Rendering** | Open any `.md` file in Chrome with beautiful typography, TOC, and themes |
| **Reading Mode** | Press `aa` on any webpage to extract & render as clean Markdown |
| **Reading List** | Save articles with images for offline reading (IndexedDB + chrome.storage) |
| **Quick Search** | Press `ss` anywhere to search your saved articles (1-5 to open) |
| **3 Skins** | Paper (warm serif) · Grid (notebook) · Minimal (clean) |
| **Dark/Light** | Theme toggle with persistence |
| **4 Layout Presets** | Compact · Standard · Comfortable · Wide |
| **Code Highlighting** | 20+ languages with auto-detection |
| **Settings Sync** | All preferences sync across local files, reading mode & library |

## Quick Start

```bash
git clone https://github.com/beanseedling629-hash/aiMarkdown.git
cd aiMarkdown
npm install
npm run build
```

### Load into Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder
4. Open extension **Details** → enable **Allow access to file URLs**

## Usage

| Shortcut | Action |
|----------|--------|
| `aa` | Enter reading mode (current page) |
| `ss` | Quick search saved articles |
| `1-5` | Open search result by number |
| `ESC` | Exit reading mode / close search |

### Popup Menu

- **阅读模式** — Enter reading mode on current page
- **阅读列表** — Open your saved article library
- **浏览本地文件夹** — Browse local Markdown files

## Architecture

```
src/
├── content/           # Content scripts
│   ├── index.ts       # Local .md file renderer
│   ├── reader.ts      # Reading mode (inject into current page)
│   └── hotkey.ts      # aa/ss shortcuts + search overlay
├── core/              # Shared modules
│   ├── renderer.ts    # markdown-it + highlight.js
│   ├── theme.ts       # Theme/skin/settings (chrome.storage sync)
│   ├── layout-styles.ts # Shared layout CSS
│   ├── article-styles.ts # Article typography CSS
│   ├── toc.ts         # Collapsible TOC builder
│   └── scroll-sync.ts # IntersectionObserver scroll tracking
├── reader/            # Article extraction & conversion
│   ├── extractor.ts   # @mozilla/readability
│   ├── converter.ts   # Turndown HTML→MD
│   └── saver.ts       # Save to internal storage + images
├── storage/           # Data layer
│   ├── article-store.ts  # chrome.storage.local (articles)
│   ├── image-store.ts    # IndexedDB (image blobs)
│   └── group-store.ts   # Reading list groups
├── library/           # Reading list page
├── reader-page/       # Saved article viewer
├── viewer/            # Popup + folder browser
└── background/        # Service worker (dynamic injection)
```

## Tech Stack

- **Vite 6** + TypeScript — Build toolchain
- **markdown-it** — Markdown parsing (anchor, task lists, KaTeX)
- **highlight.js** — Syntax highlighting (20+ languages, auto-detect)
- **@mozilla/readability** — Article extraction
- **Turndown** — HTML to Markdown conversion
- **IndexedDB** — Image blob storage
- **Chrome Extension MV3** — Service Worker + Scripting API

## License

[MIT](LICENSE)
