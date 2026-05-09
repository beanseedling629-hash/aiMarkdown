/**
 * Reader Page - Extension page that renders saved/temp articles
 * using the exact same rendering logic as local .md files.
 *
 * URL format: reader-page.html?id=xxx (saved article)
 *             reader-page.html?temp=1 (temporary reading mode article)
 */
import { renderMarkdown } from '../core/renderer'
import { buildTOC, initTOCCollapse } from '../core/toc'
import { initTheme, toggleTheme, cycleSkin, getCurrentTheme, getCurrentSkin, getSettings, saveSettings, applySettings, type Skin, type Settings, type FontFamily, type Layout } from '../core/theme'
import { initScrollSync } from '../core/scroll-sync'
import { getArticleStyles } from '../core/article-styles'
import { getLayoutStyles } from '../core/layout-styles'
import { getArticle } from '../storage/article-store'
import { getImage } from '../storage/image-store'
import { saveArticleToLibrary, extractImageUrls } from '../reader/saver'

const TEMP_KEY = 'reader_temp_article'

async function init() {
  const params = new URLSearchParams(window.location.search)
  const articleId = params.get('id')
  const isTemp = params.get('temp') === '1'

  let markdown = ''
  let title = '阅读中...'
  let tempUrl = ''
  let images: { key: string; originalUrl: string }[] = []

  if (isTemp) {
    // Temporary article from reading mode
    const result = await chrome.storage.local.get(TEMP_KEY)
    const temp = result[TEMP_KEY]
    if (temp) {
      markdown = temp.markdown
      title = temp.title || '阅读模式'
      tempUrl = temp.url || ''
      // Don't remove temp data immediately — save button needs it
    }
  } else if (articleId) {
    // Saved article from library
    const article = await getArticle(articleId)
    if (article) {
      markdown = article.markdown
      title = article.title
      images = article.images
    }
  }

  if (!markdown) {
    document.body.innerHTML = '<p style="padding:40px;text-align:center;color:#999">无法加载文章内容</p>'
    return
  }

  // Replace idb:// image URLs with blob URLs
  for (const img of images) {
    const stored = await getImage(img.key)
    const replacement = stored
      ? URL.createObjectURL(stored.blob)
      : img.originalUrl
    markdown = markdown.replace(
      new RegExp(`idb://${img.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
      replacement
    )
  }

  // Set page title
  document.title = title

  // Build the page — identical to content/index.ts
  const settings = getSettings()
  document.documentElement.innerHTML = buildPageHTML(title, isTemp)
  injectStyles()
  await initTheme()

  // Render markdown
  const contentEl = document.getElementById('md-content')!
  const { html, tocItems } = renderMarkdown(markdown)
  contentEl.innerHTML = html

  // Build TOC
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
    document.getElementById('settings-panel')!.classList.toggle('open')
  })

  // Close settings on outside click
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('settings-panel')
    const btn = document.getElementById('settings-toggle')
    if (panel && btn && !panel.contains(e.target as Node) && !btn.contains(e.target as Node)) {
      panel.classList.remove('open')
    }
  })

  // Init settings panel
  initSettingsPanel(settings, tocItems)

  // Save button (only for temp/reading mode articles)
  const saveBtn = document.getElementById('save-btn')
  if (saveBtn && isTemp) {
    saveBtn.style.display = 'inline-flex'
    saveBtn.addEventListener('click', async () => {
      saveBtn.textContent = '保存中...'
      saveBtn.setAttribute('disabled', 'true')
      try {
        const imageUrls = extractImageUrls(markdown)
        await saveArticleToLibrary({
          title,
          url: tempUrl || '',
          markdown,
          imageUrls,
        })
        saveBtn.textContent = '✓ 已保存'
        setTimeout(() => { saveBtn.textContent = '保存' }, 2000)
      } catch (e) {
        saveBtn.textContent = '保存失败'
        setTimeout(() => { saveBtn.textContent = '保存' }, 2000)
      }
      saveBtn.removeAttribute('disabled')
    })
  }

  updateIcons()
  applySettings(settings)
}

function initSettingsPanel(settings: Settings, tocItems: { level: number; text: string; id: string }[]) {
  const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement
  const zoomValue = document.getElementById('zoom-value')!
  if (zoomSlider) {
    zoomSlider.value = String(settings.zoom)
    zoomValue.textContent = `${Math.round(settings.zoom * 100)}%`
    zoomSlider.addEventListener('input', () => {
      const zoom = parseFloat(zoomSlider.value)
      zoomValue.textContent = `${Math.round(zoom * 100)}%`
      const s = getSettings()
      s.zoom = zoom
      saveSettings(s)
      applySettings(s)
    })
  }

  const tocDepthSlider = document.getElementById('toc-depth-slider') as HTMLInputElement
  const tocDepthValue = document.getElementById('toc-depth-value')!
  if (tocDepthSlider) {
    tocDepthSlider.value = String(settings.tocDepth)
    tocDepthValue.textContent = `${settings.tocDepth} 层`
    tocDepthSlider.addEventListener('input', () => {
      const depth = parseInt(tocDepthSlider.value)
      tocDepthValue.textContent = `${depth} 层`
      const s = getSettings()
      s.tocDepth = depth
      saveSettings(s)
      const tocEl = document.getElementById('md-toc')!
      tocEl.innerHTML = buildTOC(tocItems, depth)
      initTOCCollapse(tocEl)
      initScrollSync(tocEl)
    })
  }

  const fontSelect = document.getElementById('font-select') as HTMLSelectElement
  if (fontSelect) {
    fontSelect.value = settings.fontFamily
    fontSelect.addEventListener('change', () => {
      const s = getSettings()
      s.fontFamily = fontSelect.value as FontFamily
      saveSettings(s)
      applySettings(s)
    })
  }

  const layoutSelect = document.getElementById('layout-select') as HTMLSelectElement
  if (layoutSelect) {
    layoutSelect.value = settings.layout
    layoutSelect.addEventListener('change', () => {
      const s = getSettings()
      s.layout = layoutSelect.value as Layout
      saveSettings(s)
      applySettings(s)
    })
  }
}

function buildPageHTML(title: string, isTemp: boolean): string {
  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <div class="md-viewer">
    <div class="md-fab" id="md-fab">
      ${isTemp ? '<button id="save-btn" class="md-fab-btn md-fab-btn-save" title="保存到阅读列表" style="display:none;width:auto;padding:0 10px;border-radius:14px;font-size:12px;gap:4px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>保存</button>' : ''}
      <button id="skin-toggle" class="md-fab-btn" title="切换皮肤"></button>
      <button id="theme-toggle" class="md-fab-btn" title="切换主题"></button>
      <button id="settings-toggle" class="md-fab-btn" title="设置">
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
      </div>
      <div class="settings-item">
        <label class="settings-label">目录展开层级</label>
        <div class="settings-control">
          <input id="toc-depth-slider" type="range" min="1" max="6" step="1" />
          <span id="toc-depth-value" class="settings-value">2 层</span>
        </div>
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
      </div>
    </div>
    <div class="md-body">
      <main class="md-main">
        <article id="md-content" class="md-article"></article>
      </main>
      <aside id="md-sidebar" class="md-sidebar">
        <nav id="md-toc" class="md-toc"></nav>
      </aside>
    </div>
  </div>
</body>`
}

function injectStyles() {
  const style = document.createElement('style')
  style.textContent = getLayoutStyles() + getArticleStyles() + getExtraStyles()
  document.head.appendChild(style)
}

function getExtraStyles(): string {
  return /* css */`
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
}
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
  transition: opacity 200ms ease-out;
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
  transition: all 150ms ease;
}
.md-fab-btn:hover { background: var(--accent-soft); color: var(--text); }
.md-fab-btn-save {
  font-size: 12px;
  color: var(--accent);
}
.md-fab-btn-save:hover { color: var(--text); }

/* Settings Panel */
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
.settings-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.settings-item { margin-bottom: 16px; }
.settings-item:last-child { margin-bottom: 0; }
.settings-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.settings-control { display: flex; align-items: center; gap: 10px; }
.settings-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  min-width: 40px;
  text-align: right;
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
}
.settings-select {
  flex: 1;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  outline: none;
  cursor: pointer;
}
`
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
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

init()
