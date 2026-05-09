# AI Markdown Viewer

> 禅意风格的 Chrome 阅读扩展 —— 本地 Markdown 渲染、网页阅读模式、离线阅读列表。

[English](./README.md)

## 功能特性

| 功能 | 说明 |
|------|------|
| **本地 .md 渲染** | 在 Chrome 中直接打开 `.md` 文件，精美排版 + 目录 + 主题 |
| **阅读模式** | 在任意网页按 `aa` 提取正文，以 Markdown 格式沉浸阅读 |
| **阅读列表** | 保存文章 + 图片到本地，离线可读，支持分组管理 |
| **快速搜索** | 按 `ss` 弹出搜索框，按 1-5 快速打开已保存文章 |
| **3 套皮肤** | 素纸（暖色衬线）· 方格本 · 极简 |
| **明暗主题** | 一键切换，自动持久化 |
| **4 种版式** | 紧凑 · 标准 · 舒适 · 宽幅（类 Kindle 排版设置） |
| **代码高亮** | 20+ 语言，自动识别 |
| **设置同步** | 所有偏好设置在本地文件、阅读模式、阅读列表间自动同步 |

## 快速开始

```bash
git clone https://github.com/beanseedling629-hash/aiMarkdown.git
cd aiMarkdown
npm install
npm run build
```

### 加载到 Chrome

1. 打开 `chrome://extensions/`
2. 右上角开启 **开发者模式**
3. 点击 **加载已解压的扩展程序** → 选择 `dist/` 文件夹
4. 进入扩展 **详情** → 开启 **允许访问文件网址**

## 使用方式

| 快捷键 | 功能 |
|--------|------|
| `aa` | 进入阅读模式（在当前页面） |
| `ss` | 快速搜索已保存文章 |
| `1-5` | 按编号打开搜索结果 |
| `ESC` | 退出阅读模式 / 关闭搜索 |

### 弹窗菜单

- **阅读模式** — 对当前网页启用阅读模式
- **阅读列表** — 打开已保存文章的管理页面
- **浏览本地文件夹** — 浏览本地 Markdown 文件

### 设置项

| 设置 | 选项 | 默认值 |
|------|------|--------|
| 缩放 | 75% – 150% | 100% |
| 目录层级 | 1 – 6 层 | 2 层 |
| 字体 | 系统 / 衬线 / 等宽 | 系统 |
| 版式 | 紧凑 / 标准 / 舒适 / 宽幅 | 舒适 |

## 项目结构

```
src/
├── content/           # Content Scripts
│   ├── index.ts       # 本地 .md 文件渲染
│   ├── reader.ts      # 阅读模式（注入当前页面）
│   └── hotkey.ts      # aa/ss 快捷键 + 搜索浮层
├── core/              # 共享核心模块
│   ├── renderer.ts    # markdown-it + highlight.js 渲染器
│   ├── theme.ts       # 主题/皮肤/设置管理（chrome.storage 同步）
│   ├── layout-styles.ts # 共享布局样式
│   ├── article-styles.ts # 文章排版样式
│   ├── toc.ts         # 可折叠目录构建器
│   └── scroll-sync.ts # 滚动位置追踪
├── reader/            # 文章提取与转换
│   ├── extractor.ts   # @mozilla/readability 提取
│   ├── converter.ts   # Turndown HTML→MD 转换
│   └── saver.ts       # 保存到内部存储 + 图片下载
├── storage/           # 数据层
│   ├── article-store.ts  # chrome.storage.local（文章元数据）
│   ├── image-store.ts    # IndexedDB（图片 Blob）
│   └── group-store.ts   # 阅读列表分组
├── library/           # 阅读列表页面
├── reader-page/       # 已保存文章阅读器
├── viewer/            # 弹窗 + 文件夹浏览器
└── background/        # Service Worker（动态注入）
```

## 技术栈

- **Vite 6** + TypeScript — 构建工具链
- **markdown-it** — Markdown 解析（锚点、任务列表、KaTeX 数学公式）
- **highlight.js** — 语法高亮（20+ 语言，自动检测）
- **@mozilla/readability** — 文章正文提取
- **Turndown** — HTML 转 Markdown
- **IndexedDB** — 图片离线存储
- **Chrome Extension MV3** — Service Worker + Scripting API

## 许可证

[MIT](LICENSE)
