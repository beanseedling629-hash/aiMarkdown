## ADDED Requirements

### Requirement: 阅读模式与本地模式共享皮肤存储

系统 SHALL 在阅读模式中使用与本地 markdown 模式相同的 localStorage key 来存储皮肤和主题状态。

具体的 key 为：
- `md-viewer-skin`：存储当前皮肤类型（`paper` | `grid` | `minimal`）
- `md-viewer-theme`：存储当前主题（`light` | `dark`）

#### Scenario: 在本地模式下切换皮肤后在阅读模式中自动生效
- **WHEN** 用户在本地 .md 文件中将皮肤切换为 `grid`
- **AND** 用户随后在任意网页上激活阅读模式
- **THEN** 阅读模式 SHALL 使用 `grid` 皮肤渲染

#### Scenario: 在阅读模式下切换皮肤后在本地模式中自动生效
- **WHEN** 用户在阅读模式中将皮肤切换为 `minimal`
- **AND** 用户随后打开任意本地 .md 文件
- **THEN** 本地阅读器 SHALL 使用 `minimal` 皮肤渲染

### Requirement: 阅读模式支持完整的 Paper（素纸）皮肤视觉效果

当 `data-skin="paper"` 时，阅读模式 SHALL 呈现以下视觉效果：
- 内容区域使用衬线字体族（`--font-serif`）作为标题字体
- 内容字号为 16.5px，行高 1.85
- Light 主题下：背景色为 `#faf8f5`（暖纸白），代码背景为 `#f4f1ed`
- Dark 主题下：背景色为 `#1a1915`（暗纸黑），代码背景为 `#1f1d18`
- TOC 侧边栏呈现 parchment 卡片风格（圆角、微妙边框、阴影）

#### Scenario: Paper 皮肤在阅读模式中显示正确背景色
- **WHEN** 阅读模式以 Paper 皮肤 + Light 主题激活
- **THEN** 主内容区域背景色 SHALL 为 `#faf8f5`
- **AND** 代码块背景色 SHALL 为 `#f4f1ed`

### Requirement: 阅读模式支持完整的 Grid（方格本）皮肤视觉效果

当 `data-skin="grid"` 时，阅读模式 SHALL 呈现以下视觉效果：
- 阅读器覆盖层显示方格网格背景图案（由 CSS `background-image` 的 `linear-gradient` 组成）
- 网格颜色和大小由 `--grid-color` 和 `--grid-size` CSS 变量控制
- TOC 侧边栏呈现浮动卡片样式（半透明背景 + 模糊滤镜 + 阴影）

#### Scenario: Grid 皮肤在阅读模式中显示方格背景
- **WHEN** 阅读模式以 Grid 皮肤激活
- **THEN** 阅读器覆盖层 SHALL 显示 24px 间距的方格网格
- **AND** TOC 侧边栏 SHALL 显示浮动卡片效果（`backdrop-filter: blur(12px)`）

### Requirement: 阅读模式支持完整的 Minimal（极简）皮肤视觉效果

当 `data-skin="minimal"` 时，阅读模式 SHALL 呈现以下视觉效果：
- 内容使用系统默认无衬线字体
- 字号为 15.5px，行高 1.8
- Light 主题：纯白背景 `#ffffff`，深灰文字 `#374151`
- Dark 主题：纯黑背景 `#111111`

#### Scenario: Minimal 皮肤在阅读模式中显示纯白背景
- **WHEN** 阅读模式以 Minimal 皮肤 + Light 主题激活
- **THEN** 主内容区域背景色 SHALL 为 `#ffffff`

### Requirement: 阅读模式滚动条粗细与本地模式统一

阅读模式的 `::-webkit-scrollbar` 宽度 SHALL 为 4px（与本地 markdown 模式一致），取代当前的 6px。

#### Scenario: 阅读模式滚动条为 4px 宽度
- **WHEN** 阅读模式以任意皮肤激活
- **THEN** `.reader-content::-webkit-scrollbar` 的 `width` SHALL 为 `4px`
- **AND** `.reader-toc::-webkit-scrollbar` 的 `width` SHALL 为 `4px`
