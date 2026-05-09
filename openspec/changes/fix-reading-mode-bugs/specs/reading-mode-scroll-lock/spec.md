## ADDED Requirements

### Requirement: 阅读模式激活时锁定原始页面滚动

当阅读模式覆盖层被创建并附加到 DOM 时，系统 SHALL 锁定原始页面的滚动行为，防止用户与原始页面滚动条交互。

#### Scenario: 激活阅读模式时原始页面停止滚动
- **WHEN** 阅读模式覆盖层（`#ai-markdown-reader`）被附加到 `document.body`
- **THEN** `document.body.style.overflow` SHALL 被设置为 `'hidden'`
- **AND** `document.documentElement.style.overflow` SHALL 被设置为 `'hidden'`（若页面使用根元素滚动）

#### Scenario: 阅读模式内正常滚动不受影响
- **WHEN** 阅读模式激活且原始页面滚动已锁定
- **AND** 用户在 `.reader-content` 区域内滚动
- **THEN** 阅读模式内容 SHALL 正常滚动
- **AND** 原始页面 SHALL NOT 滚动

### Requirement: 退出阅读模式时恢复原始页面滚动

当阅读模式覆盖层被销毁（`destroy()` 调用）时，系统 SHALL 恢复原始页面的滚动行为到激活前的状态。

#### Scenario: 退出阅读模式后页面恢复正常滚动
- **WHEN** 阅读模式被退出（用户点击退出按钮或按 ESC）
- **THEN** `document.body.style.overflow` SHALL 被恢复为激活前的原始值
- **AND** `document.documentElement.style.overflow` SHALL 被恢复为激活前的原始值

#### Scenario: 连续多次进入退出阅读模式不累积副作用
- **WHEN** 用户连续激活和退出阅读模式 3 次
- **THEN** 每次退出后 `document.body.style.overflow` SHALL 正确恢复
- **AND** 页面滚动行为 SHALL 与从未激活阅读模式时一致

### Requirement: 阅读模式 URL 识别支持 hash 和 query 参数

`src/content/index.ts` 中的 URL 匹配正则 SHALL 支持带 hash（`#`）或 query（`?`）参数的 file:// 本地 markdown 文件 URL。

#### Scenario: 带 hash 的本地 .md 文件被正确识别
- **WHEN** 用户打开 `file:///C:/path/to/file.md#section-heading`
- **THEN** 内容脚本 SHALL 匹配该 URL 并调用 `init()` 渲染 markdown

#### Scenario: 带 query 的本地 .md 文件被正确识别
- **WHEN** 用户打开 `file:///C:/path/to/file.md?version=2`
- **THEN** 内容脚本 SHALL 匹配该 URL 并调用 `init()` 渲染 markdown
