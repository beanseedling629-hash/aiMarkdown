/**
 * Reading Mode Content Script
 *
 * Extracts article, converts to Markdown, then replaces the current page DOM
 * with the full MD viewer layout (same as local .md rendering).
 * This keeps the URL unchanged so other extensions (Vimium etc.) still work.
 */
import { extractArticle } from '../reader/extractor'
import { convertToMarkdown, titleToMarkdown, metadataToMarkdown } from '../reader/converter'
import { renderMarkdown } from '../core/renderer'
import { buildTOC, initTOCCollapse } from '../core/toc'
import { initTheme, toggleTheme, cycleSkin, getCurrentTheme, getCurrentSkin, getSettings, saveSettings, applySettings, type Skin, type Settings, type FontFamily, type Layout } from '../core/theme'
import { initScrollSync } from '../core/scroll-sync'
import { getArticleStyles } from '../core/article-styles'
import { getLayoutStyles } from '../core/layout-styles'
import { saveArticleToLibrary, extractImageUrls } from '../reader/saver'

// Prevent double injection
if (!document.getElementById('ai-markdown-reader-flag')) {
  main()
}

async function main() {
  // Mark injection
  const flag = document.createElement('div')
  flag.id = 'ai-markdown-reader-flag'
  flag.style.display = 'none'
  document.body.appendChild(flag)

  // Show loading
  const loading = showLoading()

  try {
    // Step 1: Extract the article
    const article = extractArticle()
    if (!article) {
      loading.remove()
      showNotification('无法从该页面提取文章内容')
      flag.remove()
      return
    }

    // Convert to Markdown
    const markdownBody = convertToMarkdown(article.content)
    const titleLine = titleToMarkdown(article.title)
    const metadata = metadataToMarkdown(article)
    const markdown = titleLine + metadata + markdownBody

    // Debug: log image info
    const tmpDiv = document.createElement('div')
    tmpDiv.innerHTML = article.content
    const imgCount = tmpDiv.querySelectorAll('img').length
    const mdImgCount = (markdown.match(/!\[.*?\]\(.*?\)/g) || []).length
    console.log(`[Reader] Article extracted: ${imgCount} img tags in HTML, ${mdImgCount} images in MD`)
    if (imgCount > 0) {
      tmpDiv.querySelectorAll('img').forEach((img, i) => {
        console.log(`[Reader] img[${i}]: src="${img.getAttribute('src')?.slice(0, 80)}" data-src="${img.getAttribute('data-src')?.slice(0, 80)}"`)
      })
    }
    const pageUrl = window.location.href

    loading.remove()

    // Save original page state for potential "back" functionality
    const originalTitle = document.title

    // Replace entire page with MD viewer
    document.documentElement.innerHTML = buildReaderPageHTML(article.title)

    // Inject styles
    const style = document.createElement('style')
    style.textContent = getLayoutStyles() + getArticleStyles() + getReaderExtraStyles()
    document.head.appendChild(style)

    // Init theme (async - loads from chrome.storage)
    await initTheme()
    const settings = getSettings()

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
    document.getElementById('theme-toggle')!.addEventListener('click', () => {
      toggleTheme(); updateIcons()
    })

    // Skin toggle
    document.getElementById('skin-toggle')!.addEventListener('click', () => {
      cycleSkin(); updateIcons()
    })

    // Settings toggle
    document.getElementById('settings-toggle')!.addEventListener('click', () => {
      document.getElementById('settings-panel')!.classList.toggle('open')
    })

    document.addEventListener('click', (e) => {
      const panel = document.getElementById('settings-panel')
      const btn = document.getElementById('settings-toggle')
      if (panel && btn && !panel.contains(e.target as Node) && !btn.contains(e.target as Node)) {
        panel.classList.remove('open')
      }
    })

    // Exit button — go back to original page
    document.getElementById('exit-btn')!.addEventListener('click', () => {
      window.location.reload()
    })

    // ESC to exit reading mode
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.location.reload()
      }
    })

    // Save button
    document.getElementById('save-btn')!.addEventListener('click', async () => {
      const btn = document.getElementById('save-btn')!
      btn.textContent = '保存中...'
      try {
        const imageUrls = extractImageUrls(markdown)
        await saveArticleToLibrary({ title: article.title, url: pageUrl, markdown, imageUrls })
        btn.textContent = '✓ 已保存'
        setTimeout(() => { btn.textContent = '保存' }, 2000)
      } catch {
        btn.textContent = '失败'
        setTimeout(() => { btn.textContent = '保存' }, 2000)
      }
    })

    // Init settings panel
    initSettingsPanel(settings, tocItems)
    updateIcons()
    applySettings(settings)

  } catch (e) {
    loading.remove()
    flag.remove()
    showNotification('提取文章失败')
    console.error('[Reader]', e)
  }
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
      const s = getSettings(); s.zoom = zoom; saveSettings(s)
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
      const s = getSettings(); s.tocDepth = depth; saveSettings(s)
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
      const s = getSettings(); s.fontFamily = fontSelect.value as FontFamily; saveSettings(s)
    })
  }

  const layoutSelect = document.getElementById('layout-select') as HTMLSelectElement
  if (layoutSelect) {
    layoutSelect.value = settings.layout
    layoutSelect.addEventListener('change', () => {
      const s = getSettings(); s.layout = layoutSelect.value as Layout; saveSettings(s)
    })
  }
}

function buildReaderPageHTML(title: string): string {
  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <div class="md-viewer">
    <div class="md-fab" id="md-fab">
      <button id="exit-btn" class="md-fab-btn" title="退出阅读模式" style="width:auto;padding:0 10px;border-radius:14px;font-size:12px;">✕</button>
      <button id="save-btn" class="md-fab-btn" title="保存到阅读列表" style="width:auto;padding:0 10px;border-radius:14px;font-size:12px;gap:4px">保存</button>
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

function getReaderExtraStyles(): string {
  return /* css */`
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--content-font, var(--font-sans));
  font-size: var(--content-size, 16px);
  line-height: var(--content-line-height, 1.8);
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}
.md-fab {
  position: fixed; top: 16px; right: 24px; z-index: 1000;
  display: flex; align-items: center; gap: 2px; padding: 4px 6px;
  background: var(--fab-bg); border: 1px solid var(--fab-border);
  border-radius: 20px; backdrop-filter: blur(16px);
  opacity: 0.35; transition: opacity 200ms;
}
.md-fab:hover { opacity: 1; }
.md-fab-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; border-radius: 50%;
  background: transparent; color: var(--text-secondary); cursor: pointer;
  transition: all 150ms;
}
.md-fab-btn:hover { background: var(--accent-soft); color: var(--text); }
.settings-panel {
  position: fixed; top: 56px; right: 24px; z-index: 999; width: 260px; padding: 20px;
  background: var(--fab-bg); border: 1px solid var(--fab-border); border-radius: 12px;
  backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  opacity: 0; transform: translateY(-8px) scale(0.96); pointer-events: none;
  transition: opacity 200ms, transform 200ms;
}
.settings-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
.settings-title { font-size: 13px; font-weight: 600; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--border); color: var(--text); }
.settings-item { margin-bottom: 16px; }
.settings-item:last-child { margin-bottom: 0; }
.settings-label { display: block; font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; }
.settings-control { display: flex; align-items: center; gap: 10px; }
.settings-value { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); min-width: 40px; text-align: right; }
.settings-panel input[type="range"] { flex: 1; height: 3px; -webkit-appearance: none; background: var(--border); border-radius: 2px; outline: none; cursor: pointer; }
.settings-panel input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--text-secondary); border: 2px solid var(--bg); cursor: pointer; }
.settings-select { flex: 1; font-size: 13px; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text); outline: none; cursor: pointer; }
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

function showLoading(): HTMLElement {
  const div = document.createElement('div')
  div.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:10px 20px;border-radius:8px;font-size:14px;z-index:2147483647;font-family:-apple-system,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.2);`
  div.textContent = '正在提取文章...'
  document.body.appendChild(div)
  return div
}

function showNotification(msg: string) {
  const div = document.createElement('div')
  div.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#e74c3c;color:white;padding:12px 24px;border-radius:8px;font-size:14px;z-index:2147483647;font-family:-apple-system,sans-serif;`
  div.textContent = msg
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 3000)
}
