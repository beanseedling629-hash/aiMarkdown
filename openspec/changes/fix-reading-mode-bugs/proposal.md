## Why

用户反馈了三个阅读模式相关的 bug，影响了日常使用的体验：本地 markdown 文件偶尔无法被正确识别渲染；阅读模式下滚动条异常（穿透/双滚动条）；阅读模式没有延续本地 markdown 的精致皮肤效果。这些 bug 破坏了作为"markdown 阅读器 + 阅读模式"工具的核心体验一致性。

## What Changes

- **修复本地 .md 文件 URL 正则匹配**：支持带 hash (`#`) 和 query (`?`) 的 file:// URL，避免中文路径 URL 编码导致的匹配失败
- **修复阅读模式滚动条**：创建覆盖层时锁定原始页面 body 滚动，退出时恢复，消除双滚动条和事件穿透
- **统一皮肤系统**：阅读模式与本地 markdown 模式共享同一套皮肤状态（localStorage key 统一）和完整的 skin CSS 变量（背景色、代码颜色、TOC 卡片、Grid 方格背景等）

## Capabilities

### New Capabilities
- `unified-skin-system`: 阅读模式与本地 markdown 阅读器共享同一套皮肤定义和状态存储，包括 Paper（素纸）、Grid（方格本）、Minimal（极简）三种皮肤的完整视觉效果
- `reading-mode-scroll-lock`: 阅读模式激活时锁定原始页面滚动，退出时恢复，确保滚动行为正常

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- `src/content/index.ts` — URL 正则修改（第 8 行）
- `src/reader/reader-ui.ts` — 添加 body 滚动锁定逻辑（`createReadingMode` + `destroy`）、扩展皮肤 CSS 变量定义（`injectStyles`/`getReaderStyles`）、统一 localStorage key
- 无新增依赖，无 API 变更，无破坏性改动
