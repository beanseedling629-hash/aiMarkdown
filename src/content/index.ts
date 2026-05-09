import { renderMarkdown } from '../core/renderer'
import { buildTOC, initTOCCollapse } from '../core/toc'
import { initTheme, toggleTheme, cycleSkin, getCurrentTheme, getCurrentSkin, Skin, getSettings, saveSettings, applySettings, Settings, FontFamily, Layout } from '../core/theme'
import { initScrollSync } from '../core/scroll-sync'
import { resolveLocalImages } from '../core/image-resolver'

const url = window.location.href
if (/^file:\/\/.*\.(md|markdown|mdown|mkdn|mkd)$/i.test(url)) {
  init()
}

async function init() {
  const pre = document.querySelector('pre')
  const rawText = pre?.textContent || document.body.innerText || ''
  if (!rawText.trim()) return

  document.documentElement.innerHTML = buildPageHTML()
  await initTheme()
  const settings = getSettings()

  const contentEl = document.getElementById('md-content')!
  const { html, tocItems } = renderMarkdown(rawText)
  contentEl.innerHTML = html
  resolveLocalImages(contentEl, url)

  const tocEl = document.getElementById('md-toc')!
  tocEl.innerHTML = buildTOC(tocItems, settings.tocDepth)
  initTOCCollapse(tocEl)
  initScrollSync(tocEl)

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle')!
  themeBtn.addEventListener('click', () => { toggleTheme(); updateIcons() })

  // Skin toggle
  const skinBtn = document.getElementById('skin-toggle')!
  skinBtn.addEventListener('click', () => { cycleSkin(); updateIcons() })

  // Settings toggle
  const settingsBtn = document.getElementById('settings-toggle')!
  settingsBtn.addEventListener('click', () => {
    const panel = document.getElementById('settings-panel')!
    panel.classList.toggle('open')
  })

  // Close settings panel when clicking outside
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('settings-panel')!
    const btn = document.getElementById('settings-toggle')!
    if (!panel.contains(e.target as Node) && !btn.contains(e.target as Node)) {
      panel.classList.remove('open')
    }
  })

  initSettingsPanel(settings, tocItems)
  updateIcons()
}

function initSettingsPanel(settings: Settings, tocItems: { level: number; text: string; id: string }[]): void {
  // Zoom slider
  const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement
  const zoomValue = document.getElementById('zoom-value')!
  zoomSlider.value = String(settings.zoom)
  zoomValue.textContent = `${Math.round(settings.zoom * 100)}%`

  zoomSlider.addEventListener('input', () => {
    const zoom = parseFloat(zoomSlider.value)
    zoomValue.textContent = `${Math.round(zoom * 100)}%`
    const s = getSettings()
    s.zoom = zoom
    saveSettings(s)
  })

  // TOC depth
  const tocDepthSlider = document.getElementById('toc-depth-slider') as HTMLInputElement
  const tocDepthValue = document.getElementById('toc-depth-value')!
  tocDepthSlider.value = String(settings.tocDepth)
  tocDepthValue.textContent = `${settings.tocDepth} 层`

  tocDepthSlider.addEventListener('input', () => {
    const depth = parseInt(tocDepthSlider.value)
    tocDepthValue.textContent = `${depth} 层`
    const s = getSettings()
    s.tocDepth = depth
    saveSettings(s)
    // Rebuild TOC
    const tocEl = document.getElementById('md-toc')!
    tocEl.innerHTML = buildTOC(tocItems, depth)
    initTOCCollapse(tocEl)
    initScrollSync(tocEl)
  })

  // Font family select
  const fontSelect = document.getElementById('font-select') as HTMLSelectElement
  fontSelect.value = settings.fontFamily

  fontSelect.addEventListener('change', () => {
    const s = getSettings()
    s.fontFamily = fontSelect.value as FontFamily
    saveSettings(s)
  })

  // Layout select
  const layoutSelect = document.getElementById('layout-select') as HTMLSelectElement
  if (layoutSelect) {
    layoutSelect.value = settings.layout
    layoutSelect.addEventListener('change', () => {
      const s = getSettings()
      s.layout = layoutSelect.value as Layout
      saveSettings(s)
    })
  }
}

function updateIcons() {
  const themeBtn = document.getElementById('theme-toggle')!
  const skinBtn = document.getElementById('skin-toggle')!
  const theme = getCurrentTheme()
  const skin = getCurrentSkin()

  themeBtn.innerHTML = theme === 'dark'
    ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'

  const skinIcons: Record<Skin, string> = {
    paper: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    grid: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    minimal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="18" y2="18"/></svg>'
  }
  skinBtn.innerHTML = skinIcons[skin]
  skinBtn.title = `Skin: ${skin}`
}

function getFileName(): string {
  const path = decodeURIComponent(window.location.pathname)
  return path.split('/').pop() || 'Untitled'
}

function buildPageHTML(): string {
  return `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${getFileName()}</title>
  <style>${getAllStyles()}</style>
</head>
<body>
  <div class="md-viewer">
    <div class="md-fab" id="md-fab">
      <button id="skin-toggle" class="md-fab-btn" title="Change Skin"></button>
      <button id="theme-toggle" class="md-fab-btn" title="Toggle Theme"></button>
      <button id="settings-toggle" class="md-fab-btn" title="Settings">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
    </div>
    <div id="settings-panel" class="settings-panel">
      <div class="settings-title">设置</div>
      <div class="settings-item">
        <label class="settings-label">缩放比例</label>
        <div class="settings-control">
          <input id="zoom-slider" type="range" min="0.75" max="1.5" step="0.05" />
          <span id="zoom-value" class="settings-value">100%</span>
        </div>
        <div class="settings-hint">默认 100%</div>
      </div>
      <div class="settings-item">
        <label class="settings-label">目录展开层级</label>
        <div class="settings-control">
          <input id="toc-depth-slider" type="range" min="1" max="6" step="1" />
          <span id="toc-depth-value" class="settings-value">2 层</span>
        </div>
        <div class="settings-hint">默认 2 层（显示 h1 + h2）</div>
      </div>
      <div class="settings-item">
        <label class="settings-label">正文字体</label>
        <div class="settings-control">
          <select id="font-select" class="settings-select">
            <option value="system">系统默认</option>
            <option value="serif">衬线体（宋体）</option>
            <option value="mono">等宽体</option>
          </select>
        </div>
        <div class="settings-hint">系统默认 = 苹方/思源黑体</div>
      </div>
      <div class="settings-item">
        <label class="settings-label">版式</label>
        <div class="settings-control">
          <select id="layout-select" class="settings-select">
            <option value="compact">紧凑</option>
            <option value="standard">标准</option>
            <option value="comfortable">舒适</option>
            <option value="wide">宽幅</option>
          </select>
        </div>
        <div class="settings-hint">控制内容宽度和行距</div>
      </div>
    </div>
    <div class="md-body">
      <main class="md-main">
        <div class="md-filename">${getFileName()}</div>
        <article id="md-content" class="md-article"></article>
      </main>
      <aside id="md-sidebar" class="md-sidebar">
        <nav id="md-toc" class="md-toc"></nav>
      </aside>
    </div>
  </div>
</body>`
}

function getAllStyles(): string {
  return `
/* ============================================ */
/* BASE VARIABLES                                */
/* ============================================ */
:root {
  /* 无衬线：英文 Inter（清晰易读）+ 中文苹方/思源黑体 */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  /* 衬线：英文 Charter/Georgia + 中文思源宋体 */
  --font-serif: Charter, 'Bitstream Charter', 'Noto Serif SC', 'Source Han Serif SC', 'STSongti-SC', Georgia, serif;
  /* 等宽：JetBrains Mono 数字辨识度高 */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace;
  --content-max-width: 720px;
  --toc-width: 220px;
  --radius: 8px;
  --radius-sm: 4px;
  --transition-fast: 150ms ease;
  --transition: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}

/* ============================================ */
/* THEME: LIGHT                                  */
/* ============================================ */
[data-theme="light"] {
  --bg: #faf8f5;
  --bg-secondary: #f5f2ee;
  --text: #2c2c2c;
  --text-secondary: #555550;
  --text-muted: #9c9890;
  --border: #eae6e0;
  --accent: #5a7a9a;
  --accent-soft: rgba(90, 122, 154, 0.08);
  --code-bg: #f4f1ed;
  --code-text: #2c2c2c;
  --code-border: #e8e4de;
  --blockquote-border: rgba(0,0,0,0.12);
  --blockquote-bg: transparent;
  --link: #4a7a6a;
  --toc-text: rgba(0,0,0,0.38);
  --toc-text-hover: rgba(0,0,0,0.7);
  --toc-text-active: rgba(0,0,0,0.88);
  --toc-indicator: rgba(0,0,0,0.5);
  --fab-bg: rgba(255,255,255,0.72);
  --fab-border: rgba(0,0,0,0.06);
}

/* ============================================ */
/* THEME: DARK                                   */
/* ============================================ */
[data-theme="dark"] {
  --bg: #1a1915;
  --bg-secondary: #222018;
  --text: #e8e4df;
  --text-secondary: #b8b4ae;
  --text-muted: #6b6660;
  --border: #33302a;
  --accent: #8ab4d4;
  --accent-soft: rgba(138, 180, 212, 0.08);
  --code-bg: #1f1d18;
  --code-text: #e8e4df;
  --code-border: #33302a;
  --blockquote-border: rgba(255,255,255,0.12);
  --blockquote-bg: transparent;
  --link: #8ac4a8;
  --toc-text: rgba(255,255,255,0.3);
  --toc-text-hover: rgba(255,255,255,0.65);
  --toc-text-active: rgba(255,255,255,0.9);
  --toc-indicator: rgba(255,255,255,0.55);
  --fab-bg: rgba(26,25,21,0.75);
  --fab-border: rgba(255,255,255,0.08);
}

/* ============================================ */
/* SKIN: PAPER (素纸)                            */
/* ============================================ */
[data-skin="paper"] {
  --content-font: var(--font-sans);
  --content-size: 16.5px;
  --content-line-height: 1.85;
  --content-letter-spacing: 0.01em;
  --heading-font: var(--font-serif);
}
[data-skin="paper"][data-theme="light"] {
  --bg: #faf8f5;
  --code-bg: #f4f1ed;
  --code-border: #e8e4de;
}
[data-skin="paper"][data-theme="dark"] {
  --bg: #1a1915;
  --code-bg: #1f1d18;
  --code-border: #33302a;
}
/* Paper skin: subtle parchment card for TOC */
[data-skin="paper"][data-theme="light"] .md-sidebar {
  background: rgba(255, 252, 248, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.03);
}
[data-skin="paper"][data-theme="dark"] .md-sidebar {
  background: rgba(26, 25, 21, 0.7);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 8px;
}

/* ============================================ */
/* SKIN: GRID (方格)                             */
/* ============================================ */
[data-skin="grid"] {
  --content-font: var(--font-sans);
  --content-size: 15px;
  --content-line-height: 1.75;
  --content-letter-spacing: 0;
  --heading-font: var(--font-sans);
  --grid-color: rgba(100, 130, 180, 0.06);
  --grid-size: 24px;
}
[data-skin="grid"][data-theme="light"] {
  --bg: #fafbfc;
  --grid-color: rgba(100, 130, 180, 0.06);
  --toc-card-bg: rgba(255, 255, 255, 0.82);
  --toc-card-border: rgba(0, 0, 0, 0.06);
  --toc-card-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0.5px 1px rgba(0,0,0,0.03);
}
[data-skin="grid"][data-theme="dark"] {
  --bg: #0f1117;
  --grid-color: rgba(100, 140, 200, 0.04);
  --toc-card-bg: rgba(18, 20, 28, 0.85);
  --toc-card-border: rgba(255, 255, 255, 0.06);
  --toc-card-shadow: 0 2px 12px rgba(0,0,0,0.2);
}
[data-skin="grid"] .md-viewer {
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: var(--grid-size) var(--grid-size);
}
/* Grid skin: TOC as a floating card (skeuomorphic notebook tab) */
[data-skin="grid"] .md-sidebar {
  background: var(--toc-card-bg);
  border: 1px solid var(--toc-card-border);
  border-radius: 10px;
  padding: 16px 12px;
  box-shadow: var(--toc-card-shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* ============================================ */
/* SKIN: MINIMAL (极简)                          */
/* ============================================ */
[data-skin="minimal"] {
  --content-font: var(--font-sans);
  --content-size: 15.5px;
  --content-line-height: 1.8;
  --content-letter-spacing: 0;
  --heading-font: var(--font-sans);
}
[data-skin="minimal"][data-theme="light"] {
  --bg: #ffffff;
  --text: #374151;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border: #f0f0f0;
  --code-bg: #f9fafb;
  --code-border: #f0f0f0;
  --toc-text: rgba(0,0,0,0.32);
  --toc-text-hover: rgba(0,0,0,0.6);
  --toc-text-active: rgba(0,0,0,0.85);
}
[data-skin="minimal"][data-theme="dark"] {
  --bg: #111111;
  --text: #ececec;
  --text-secondary: #a0a0a0;
  --text-muted: #555555;
  --border: #222222;
  --code-bg: #181818;
  --code-border: #252525;
}

/* ============================================ */
/* RESET & BASE                                  */
/* ============================================ */
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--content-font, var(--font-sans));
  font-size: var(--content-size, 16px);
  line-height: var(--content-line-height, 1.8);
  letter-spacing: var(--content-letter-spacing, 0);
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background var(--transition), color var(--transition);
}

.md-viewer { min-height: 100vh; position: relative; }

/* ============================================ */
/* FLOATING ACTION BUBBLE                        */
/* ============================================ */
.md-fab {
  position: fixed;
  top: 16px;
  right: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: var(--fab-bg);
  border: 1px solid var(--fab-border);
  border-radius: 20px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  opacity: 0.35;
  transition: opacity var(--transition);
}
.md-fab:hover { opacity: 1; }
.md-fab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.md-fab-btn:hover { background: var(--accent-soft); color: var(--text); }

/* ============================================ */
/* BODY LAYOUT                                   */
/* ============================================ */
.md-body { display: flex; min-height: 100vh; }
.md-main {
  flex: 1;
  min-width: 0;
  padding: 60px 48px 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.md-filename {
  width: 100%;
  max-width: var(--content-max-width);
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 32px;
  opacity: 0.6;
}
.md-article {
  width: 100%;
  max-width: var(--content-max-width);
}

/* ============================================ */
/* SIDEBAR / TOC                                 */
/* ============================================ */
.md-sidebar {
  position: fixed;
  top: 60px;
  right: 32px;
  width: var(--toc-width);
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 8px;
}
.md-toc ul { list-style: none; padding: 0; margin: 0; }
.md-toc li { position: relative; }
.md-toc .toc-item.toc-hidden { display: none; }
.md-toc .toc-row {
  display: flex;
  align-items: center;
  gap: 2px;
}
.md-toc .toc-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--toc-text);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.md-toc .toc-toggle:hover { background: var(--accent-soft); color: var(--toc-text-active); }
.md-toc .toc-toggle svg { width: 10px; height: 10px; transition: transform var(--transition-fast); }
.md-toc .toc-toggle.expanded svg { transform: rotate(90deg); }
.md-toc .toc-toggle-placeholder { width: 22px; flex-shrink: 0; }
.md-toc a {
  display: block;
  flex: 1;
  padding: 5px 0 5px 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 2;
  color: var(--toc-text);
  text-decoration: none;
  transition: color var(--transition-fast);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}
.md-toc a:hover { color: var(--toc-text-hover); }
.md-toc a.active {
  color: var(--toc-text-active);
  font-weight: 500;
}
.md-toc a.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 14px;
  background: var(--toc-indicator);
  border-radius: 1px;
}

/* TOC indentation */
.md-toc .toc-level-1 a { font-size: 13px; font-weight: 500; }
.md-toc .toc-level-2 .toc-row { padding-left: 14px; }
.md-toc .toc-level-3 .toc-row { padding-left: 28px; }
.md-toc .toc-level-4 .toc-row { padding-left: 42px; }
.md-toc .toc-level-5 .toc-row { padding-left: 56px; }
.md-toc .toc-level-6 .toc-row { padding-left: 70px; }

/* ============================================ */
/* TYPOGRAPHY                                    */
/* ============================================ */
.md-article h1, .md-article h2, .md-article h3,
.md-article h4, .md-article h5, .md-article h6 {
  font-family: var(--heading-font, var(--font-sans));
  font-weight: 700;
  line-height: 1.35;
  color: var(--text);
  scroll-margin-top: 80px;
}
.md-article h1 {
  font-size: 28px;
  margin-top: 0;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}
.md-article h2 {
  font-size: 22px;
  font-weight: 600;
  margin-top: 48px;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}
.md-article h3 {
  font-size: 18px;
  font-weight: 600;
  margin-top: 36px;
  margin-bottom: 12px;
}
.md-article h4 {
  font-size: 16px;
  font-weight: 600;
  margin-top: 28px;
  margin-bottom: 8px;
}
.md-article h5 { font-size: 15px; font-weight: 600; margin-top: 24px; margin-bottom: 6px; color: var(--text-secondary); }
.md-article h6 { font-size: 14px; font-weight: 600; margin-top: 20px; margin-bottom: 6px; color: var(--text-muted); }

/* Paper skin: serif headings, h1 centered */
[data-skin="paper"] .md-article h1 { text-align: center; margin-bottom: 32px; }
[data-skin="paper"] .md-article h1,
[data-skin="paper"] .md-article h2,
[data-skin="paper"] .md-article h3 { font-family: var(--font-serif); }

.md-article p {
  margin: 0 0 1.4em;
}
.md-article a { color: var(--link); text-decoration: none; transition: opacity var(--transition-fast); }
.md-article a:hover { opacity: 0.7; text-decoration: underline; }
.md-article strong { font-weight: 600; }
.md-article em { font-style: italic; }
.md-article ul, .md-article ol { margin: 0 0 1.4em; padding-left: 1.5em; }
.md-article li { margin: 0.4em 0; line-height: 1.75; }
.md-article li > ul, .md-article li > ol { margin-bottom: 0; }
.md-article ul li::marker { color: var(--text-muted); }
.md-article ol li::marker { color: var(--text-muted); }

/* Code */
.md-article code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  padding: 0.15em 0.4em;
  background: var(--code-bg);
  border-radius: var(--radius-sm);
  color: var(--accent);
}
.md-article pre {
  margin: 1.8em 0;
  padding: 20px 24px;
  background: var(--code-bg);
  border-radius: var(--radius);
  overflow-x: auto;
  border: none;
}
.md-article pre code {
  padding: 0;
  background: none;
  border: none;
  font-size: 13.5px;
  line-height: 1.7;
  color: inherit;
}

/* Blockquote */
.md-article blockquote {
  margin: 1.6em 0;
  padding: 12px 20px;
  border-left: 3px solid var(--blockquote-border);
  background: var(--blockquote-bg);
  color: inherit;
  opacity: 0.8;
  font-style: italic;
}
.md-article blockquote p:last-child { margin-bottom: 0; }

/* Tables */
.md-article table { width: 100%; margin: 1.6em 0; border-collapse: collapse; font-size: 0.9em; }
.md-article th, .md-article td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); }
.md-article th { font-weight: 600; font-size: 0.85em; color: var(--text-secondary); }
.md-article tr:last-child td { border-bottom: none; }

/* HR — invisible, just spacing */
.md-article hr { margin: 3em 0; border: none; height: 0; }

/* Images */
.md-article img { max-width: 100%; height: auto; border-radius: var(--radius); margin: 1.4em 0; }

/* Task lists */
.md-article input[type="checkbox"] { margin-right: 6px; accent-color: var(--accent); transform: scale(1.1); }

/* ============================================ */
/* HIGHLIGHT.JS THEME                            */
/* ============================================ */
.hljs {
  display: block;
  overflow-x: auto;
  padding: 20px 24px;
  background: var(--code-bg);
  color: var(--code-text);
  font-size: 13.5px;
  font-family: var(--font-mono);
  line-height: 1.7;
  border-radius: var(--radius);
  margin: 1.8em 0;
  border: none;
}
.hljs-comment, .hljs-meta { color: #8b949e; font-style: italic; }
[data-theme="light"] .hljs-comment, [data-theme="light"] .hljs-meta { color: #6a737d; }
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section { color: #ff7b72; font-weight: 500; }
[data-theme="light"] .hljs-keyword, [data-theme="light"] .hljs-selector-tag, [data-theme="light"] .hljs-literal, [data-theme="light"] .hljs-section { color: #a626a4; }
.hljs-string, .hljs-title, .hljs-name, .hljs-type, .hljs-attribute, .hljs-symbol, .hljs-bullet, .hljs-addition { color: #a5d6ff; }
[data-theme="light"] .hljs-string, [data-theme="light"] .hljs-title, [data-theme="light"] .hljs-name, [data-theme="light"] .hljs-type, [data-theme="light"] .hljs-attribute, [data-theme="light"] .hljs-symbol, [data-theme="light"] .hljs-bullet, [data-theme="light"] .hljs-addition { color: #50a14f; }
.hljs-deletion { color: #ffa198; }
[data-theme="light"] .hljs-deletion { color: #e45649; }
.hljs-variable, .hljs-template-variable { color: #79c0ff; }
[data-theme="light"] .hljs-variable, [data-theme="light"] .hljs-template-variable { color: #986801; }
.hljs-number, .hljs-regexp, .hljs-built_in, .hljs-params { color: #79c0ff; }
[data-theme="light"] .hljs-number, [data-theme="light"] .hljs-regexp, [data-theme="light"] .hljs-built_in, [data-theme="light"] .hljs-params { color: #0184bc; }
.hljs-function, .hljs-attr { color: #d2a8ff; }
[data-theme="light"] .hljs-function, [data-theme="light"] .hljs-attr { color: #4078f2; }
.hljs-tag, .hljs-selector-id, .hljs-selector-class { color: #7ee787; }
[data-theme="light"] .hljs-tag, [data-theme="light"] .hljs-selector-id, [data-theme="light"] .hljs-selector-class { color: #e45649; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: bold; }
.hljs-link { color: var(--link); text-decoration: underline; }

/* ============================================ */
/* SCROLLBAR                                     */
/* ============================================ */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
.md-sidebar::-webkit-scrollbar { width: 3px; }
.md-sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* ============================================ */
/* RESPONSIVE                                    */
/* ============================================ */
@media (max-width: 1200px) {
  .md-sidebar { right: 16px; width: 180px; }
  .md-main { padding-right: 220px; }
}
@media (max-width: 900px) {
  .md-sidebar { display: none; }
  .md-main { padding: 40px 24px 80px; }
}
@media (max-width: 600px) {
  .md-main { padding: 32px 16px 60px; }
  .md-fab { top: 10px; right: 12px; }
}

/* ============================================ */
/* PRINT                                         */
/* ============================================ */
@media print {
  .md-fab, .md-sidebar { display: none !important; }
  .md-main { padding: 0; }
  .md-article { max-width: 100%; }
}

/* ============================================ */
/* TRANSITIONS                                   */
/* ============================================ */
.md-article, .md-sidebar, .md-fab { transition: opacity var(--transition); }

/* ============================================ */
/* FONT FAMILY OVERRIDE (via data-font attr)     */
/* ============================================ */
[data-font="system"] .md-article { font-family: var(--font-sans); }
[data-font="serif"] .md-article { font-family: var(--font-serif); }
[data-font="mono"] .md-article { font-family: var(--font-mono); font-size: 14.5px; }

/* ============================================ */
/* SETTINGS PANEL                                */
/* ============================================ */
.settings-panel {
  position: fixed;
  top: 56px;
  right: 24px;
  z-index: 999;
  width: 260px;
  padding: 20px;
  background: var(--fab-bg);
  border: 1px solid var(--fab-border);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
  pointer-events: none;
  transition: opacity 200ms ease, transform 200ms ease;
}
.settings-panel.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: all;
}
[data-theme="dark"] .settings-panel {
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.settings-title {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.settings-item {
  margin-bottom: 16px;
}
.settings-item:last-child { margin-bottom: 0; }
.settings-label {
  display: block;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.settings-control {
  display: flex;
  align-items: center;
  gap: 10px;
}
.settings-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  min-width: 40px;
  text-align: right;
}
.settings-hint {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  opacity: 0.7;
}
.settings-panel input[type="range"] {
  flex: 1;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.settings-panel input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-secondary);
  border: 2px solid var(--bg);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.settings-panel input[type="range"]::-webkit-slider-thumb:hover {
  background: var(--text);
}
.settings-select {
  flex: 1;
  font-family: var(--font-sans);
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}
.settings-select:focus {
  border-color: var(--accent);
}
`
}
