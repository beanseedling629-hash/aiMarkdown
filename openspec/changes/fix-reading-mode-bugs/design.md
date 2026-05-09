## Context

aiMarkdown 是一个 Chrome MV3 扩展，有两个独立的内容渲染模式：

```
┌─────────────────────────────────────────────────────────────┐
│                      架构现状                                │
├──────────────────────┬──────────────────────────────────────┤
│  本地 Markdown 模式   │          阅读模式                    │
│  content/index.ts    │  reader/reader-ui.ts                 │
│  整页替换 HTML       │  Shadow DOM 覆盖层                   │
│  localStorage:       │  localStorage:                       │
│    md-viewer-skin    │    md-reader-skin     ← 不共享!     │
│    md-viewer-theme   │    md-reader-theme    ← 不共享!     │
│  20+ CSS 变量/皮肤   │  4 个 CSS 变量/皮肤   ← 不统一!     │
├──────────────────────┴──────────────────────────────────────┤
│  共享模块: core/theme.ts, core/toc.ts, core/scroll-sync.ts  │
│  core/renderer.ts (markdown-it 渲染引擎)                     │
└─────────────────────────────────────────────────────────────┘
```

当前三个问题：
1. `content/index.ts:8` URL 正则 `/^file:\/\/.*\.(md|...)$/i` 的 `$` 过于严格
2. 阅读模式覆盖层未锁定原始页面 body 滚动
3. 两个模式皮肤系统完全独立，阅读模式皮肤极度简陋

## Goals / Non-Goals

**Goals:**
- 修复本地 .md 文件 URL 匹配：支持带 `#` hash 和 `?` query 的 file:// URL
- 阅读模式激活时锁定原始页面滚动，退出时恢复
- 统一两套皮肤系统：共享 localStorage key，阅读模式继承完整的 20+ CSS 皮肤变量

**Non-Goals:**
- 不重构 content/index.ts 的整页替换机制
- 不修改 markdown-it 渲染引擎
- 不新增皮肤类型

## Decisions

### Decision 1: URL 正则修复方案

**选择**: 将正则改为 `/^file:\/\/.*\.(md|markdown|mdown|mkdn|mkd)([?#].*)?$/i`

**理由**: 在原正则末尾追加 `([?#].*)?` 来允许可选 hash/query，改动最小、最安全。无论 URL 是 `file:///test.md`、`file:///test.md#section` 还是 `file:///test.md?t=1` 都能匹配。

### Decision 2: Scroll Lock 实现方式

**选择**: 在 Shadow DOM host 的 `appendChild` 后立即设置 `document.body.style.overflow = 'hidden'`，在 `destroy()` 中恢复。

**理由**:
- 改动最小，仅需 4 行代码
- 无需新增 CSS 类
- 同时处理 `document.documentElement` 的 overflow（某些页面根元素也会滚动）

**备选方案（弃用）**: 
- CSS class 方式：需要注入全局样式，可能被页面自身 CSS 覆盖
- `position: fixed` on body：会破坏 body 的滚动位置

### Decision 3: 皮肤系统统一方案

**选择**: 阅读模式使用与本地模式相同的 localStorage key (`md-viewer-skin` / `md-viewer-theme`)，并迁移完整的皮肤 CSS 变量。

**具体变更**:
1. `reader-ui.ts` 第 14-15 行：`THEME_KEY` 从 `'md-reader-theme'` 改为 `'md-viewer-theme'`，`SKIN_KEY` 从 `'md-reader-skin'` 改为 `'md-viewer-skin'`
2. `reader-ui.ts` 的 `getReaderStyles()` 中，每个皮肤属性块从仅 4 个变量扩展到完整集合，变量名与本地模式对齐：
   - Paper: `--bg`, `--code-bg`, `--code-border` (与 light/dark 组合)
   - Grid: `--bg`, `--grid-color`, `--grid-size`, TOC 卡片变量
   - Minimal: `--bg`, `--text`, `--text-secondary`, `--border`, `--code-bg`, `--code-border`
   - 所有皮肤: `--content-font`, `--heading-font`, `--content-line-height`, `--content-letter-spacing`, `--link`, `--blockquote-*`, `--toc-*`, `--scrollbar-*`
3. 将 `font-family` 从 `var(--font-body)` 改为使用 `--content-font` / `--heading-font` 与本地模式变量名对齐
4. 统一 scrollbar 宽度从 6px 改为 4px

**选择理由**: 使用相同的 localStorage key 让用户在一次切换后两个模式自动同步；完整的 CSS 变量确保视觉一致性。在 Shadow DOM 中 CSS 变量仍然有效（Shadow DOM 继承自定义属性）。

## Risks / Trade-offs

- **[Risk] 统一 localStorage key 后，旧用户的阅读模式将丢失之前的皮肤设置** → **Mitigation**: 在 `initReaderUI` 中加一个 `try/catch` 读取旧 key 做一次性迁移（非关键，影响极小）
- **[Risk] Grid 皮肤的 `background-image` 方格图案在 Shadow DOM 中可能不生效** → **Mitigation**: 在 `.reader-overlay` 上设置 `background`，使用 `::part()` 或直接在 Shadow DOM 内设置
- **[Risk] 锁定 body 滚动后，某些 SPA 页面可能在退出阅读模式时恢复异常** → **Mitigation**: 保存原始值后恢复，不假设默认值为 `''`
