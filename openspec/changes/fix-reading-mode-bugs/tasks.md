## 1. 修复本地 .md 文件 URL 正则

- [x] 1.1 修改 `src/content/index.ts` 第 8 行正则：将 `/^file:\/\/.*\.(md|markdown|mdown|mkdn|mkd)$/i` 改为 `/^file:\/\/.*\.(md|markdown|mdown|mkdn|mkd)([?#].*)?$/i`

## 2. 修复阅读模式滚动条穿透

- [x] 2.1 在 `src/reader/reader-ui.ts` 的 `createReadingMode()` 函数中：在 `document.body.appendChild(host)` 之后（第 41 行附近），保存原始 `document.body.style.overflow` 和 `document.documentElement.style.overflow` 值，并将其设为 `'hidden'`
- [x] 2.2 在 `destroy` 回调中恢复原始 `document.body.style.overflow` 和 `document.documentElement.style.overflow`

## 3. 统一皮肤系统 - 状态共享

- [x] 3.1 修改 `src/reader/reader-ui.ts` 第 14-15 行：将 `THEME_KEY` 从 `'md-reader-theme'` 改为 `'md-viewer-theme'`，将 `SKIN_KEY` 从 `'md-reader-skin'` 改为 `'md-viewer-skin'`

## 4. 统一皮肤系统 - CSS 变量迁移

- [x] 4.1 在 `src/reader/reader-ui.ts` 的 `getReaderStyles()` 中，将 Paper 皮肤块（`[data-skin="paper"]`）扩展为：添加 `--content-line-height: 1.85`、`--content-letter-spacing: 0.01em`；添加 `[data-skin="paper"][data-theme="light"]` 和 `[data-skin="paper"][data-theme="dark"]` 子块定义 `--bg`、`--code-bg`、`--code-border`；添加 Paper 皮肤专属的 `.reader-toc` TOC 卡片样式（圆角、边框、阴影）
- [x] 4.2 将 Grid 皮肤块（`[data-skin="grid"]`）扩展为：添加 `--content-line-height: 1.75`、`--content-letter-spacing: 0`、`--grid-color`、`--grid-size: 24px`；添加 `[data-skin="grid"][data-theme="light"]` 和 `[data-skin="grid"][data-theme="dark"]` 子块；添加 Grid 皮肤的方格背景 `background-image` 和 TOC 浮动卡片样式（`backdrop-filter: blur(12px)`）
- [x] 4.3 将 Minimal 皮肤块（`[data-skin="minimal"]`）扩展为：添加 `--content-line-height: 1.8`、`--content-letter-spacing: 0`；添加 `[data-skin="minimal"][data-theme="light"]` 和 `[data-skin="minimal"][data-theme="dark"]` 子块
- [x] 4.4 统一所有皮肤的字体变量名：将 `.md-article` 中的 `font-family: var(--font-body)` 改为 `font-family: var(--content-font, var(--font-body))`；标题中 `font-family: var(--font-heading)` 改为 `font-family: var(--heading-font, var(--font-heading))`
- [x] 4.5 统一 scrollbar 宽度：将 `.reader-content::-webkit-scrollbar` 和 `.reader-toc::-webkit-scrollbar` 的 `width` 从 `6px` 改为 `4px`

## 5. 构建验证

- [x] 5.1 运行 `npm run build` 确保所有更改编译通过
- [x] 5.5 修复 highlight.js ES module → IIFE 初始化顺序导致 PHP 语法 `QUOTE_STRING_MODE` 为 null 的崩溃：将 `highlight.js/lib/core` + 手动注册语言改为 `import hljs from 'highlight.js'` 完整导入
- [ ] 5.2 手动测试：打开本地 .md 文件验证所有 3 种皮肤+2 种主题组合
- [ ] 5.3 手动测试：在任意网页激活阅读模式，切换皮肤/主题验证一致性
- [ ] 5.4 手动测试：验证阅读模式滚动条不会穿透到原始页面
