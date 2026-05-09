/**
 * Reading mode UI – Shadow DOM overlay.
 *
 * Creates a full-screen overlay with Shadow DOM for complete style isolation.
 * Supports 3 skins (paper/grid/minimal) + dark/light theme.
 * Uses HTML→Markdown→markdown-it pipeline for unified styling.
 */
import type { ArticleResult } from './extractor'
import { convertToMarkdown } from './converter'
import { renderMarkdown } from '../core/renderer'
import { buildTOC, initTOCCollapse } from '../core/toc'
import { initScrollSync } from '../core/scroll-sync'
import type { ScrollSyncOptions } from '../core/scroll-sync'
import { getArticleStyles } from '../core/article-styles'

export type Theme = 'light' | 'dark'
export type Skin = 'paper' | 'grid' | 'minimal'

const THEME_KEY = 'md-viewer-theme'
const SKIN_KEY = 'md-viewer-skin'

interface ReaderUI {
  host: HTMLElement
  shadow: ShadowRoot
  destroy: () => void
}

/**
 * Create the reading mode overlay.
 * Returns a handle with a destroy() method to exit reading mode.
 *
 * Pipeline: Readability HTML → Turndown Markdown → markdown-it HTML
 * This ensures the same styling as local .md file rendering.
 */
export function createReadingMode(article: ArticleResult): ReaderUI {
  const host = document.createElement('div')
  host.id = 'ai-markdown-reader'
  const shadow = host.attachShadow({ mode: 'closed' })

  // Convert article HTML to Markdown, then re-render with markdown-it
  // This unifies the rendering pipeline with local .md file display
  const markdownText = convertToMarkdown(article.content)
  const { html: renderedHtml, tocItems } = renderMarkdown(markdownText)

  // Create a processed article with markdown-it rendered content
  const processedArticle: ArticleResult = {
    ...article,
    content: renderedHtml,
  }

  // Load saved theme/skin
  const theme = (localStorage.getItem(THEME_KEY) as Theme) || 'light'
  const skin = (localStorage.getItem(SKIN_KEY) as Skin) || 'paper'

  // Build UI with markdown-it rendered content
  shadow.innerHTML = buildHTML(processedArticle, theme, skin)
  injectStyles(shadow)

  // Append to page
  document.body.appendChild(host)

  // Lock original page scroll to prevent scroll-through
  const origBodyOverflow = document.body.style.overflow
  const origRootOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'

  // Post-render init (use pre-computed tocItems from markdown-it)
  initReaderUI(shadow, article, host, tocItems)

  return {
    host,
    shadow,
    destroy: () => {
      host.remove()
      // Restore original page scroll
      document.body.style.overflow = origBodyOverflow
      document.documentElement.style.overflow = origRootOverflow
    },
  }
}

function buildHTML(article: ArticleResult, theme: Theme, skin: Skin): string {
  return `
    <div class="reader-overlay" data-theme="${theme}" data-skin="${skin}">
      <header class="reader-toolbar">
        <div class="toolbar-left">
          <button class="tb-btn" id="btn-exit" title="退出阅读模式 (ESC)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M19 12H5"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            <span>退出</span>
          </button>
        </div>
        <div class="toolbar-center">
          <span class="toolbar-title">${escapeHtml(article.title)}</span>
          <span class="toolbar-source">${escapeHtml(article.siteName || '')}</span>
        </div>
        <div class="toolbar-right">
          <button class="tb-btn" id="btn-save" title="保存为 Markdown">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>保存</span>
          </button>
          <button class="tb-btn" id="btn-theme" title="切换主题">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </button>
          <button class="tb-btn" id="btn-skin" title="切换皮肤">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>
      </header>

      <div class="reader-body">
        <aside class="reader-toc" id="reader-toc">
          <div class="toc-header">目录</div>
          <nav id="toc-nav" class="toc-nav"></nav>
        </aside>

        <main class="reader-content">
          <article class="md-article" id="md-article">
            ${article.content}
          </article>
        </main>
      </div>

      <div class="save-toast" id="save-toast" style="display:none">
        <span id="toast-msg">保存中...</span>
      </div>
    </div>
  `
}

function initReaderUI(
  shadow: ShadowRoot,
  article: ArticleResult,
  host: HTMLElement,
  tocItems: { level: number; text: string; id: string }[]
) {
  const overlay = shadow.querySelector('.reader-overlay') as HTMLElement

  // --- TOC ---
  const tocNav = shadow.getElementById('toc-nav')!

  if (tocItems.length > 0) {
    tocNav.innerHTML = buildTOC(tocItems, 3)
    initTOCCollapse(tocNav)

    // Get the scroll container for the article content
    const readerContent = shadow.querySelector('.reader-content') as HTMLElement
    const syncOptions: ScrollSyncOptions = {
      root: shadow as unknown as Document,
      scrollContainer: readerContent,
      sidebarSelector: '.reader-toc',
    }
    initScrollSync(tocNav, syncOptions)
  } else {
    const toc = shadow.getElementById('reader-toc')!
    toc.style.display = 'none'
  }

  // --- Exit button ---
  const btnExit = shadow.getElementById('btn-exit')!
  btnExit.addEventListener('click', () => host.remove())

  // ESC key to exit
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') host.remove()
  }
  document.addEventListener('keydown', onKeydown)

  // Clean up event listener when host is removed
  const observer = new MutationObserver(() => {
    if (!document.body.contains(host)) {
      document.removeEventListener('keydown', onKeydown)
      observer.disconnect()
    }
  })
  observer.observe(document.body, { childList: true })

  // --- Theme toggle ---
  const btnTheme = shadow.getElementById('btn-theme')!
  btnTheme.addEventListener('click', () => {
    const current = overlay.getAttribute('data-theme') as Theme
    const next: Theme = current === 'dark' ? 'light' : 'dark'
    overlay.setAttribute('data-theme', next)
    localStorage.setItem(THEME_KEY, next)
    updateThemeIcon(btnTheme, next)
  })

  // --- Skin toggle ---
  const btnSkin = shadow.getElementById('btn-skin')!
  const skins: Skin[] = ['paper', 'grid', 'minimal']
  btnSkin.addEventListener('click', () => {
    const current = overlay.getAttribute('data-skin') as Skin
    const idx = skins.indexOf(current)
    const next = skins[(idx + 1) % skins.length]
    overlay.setAttribute('data-skin', next)
    localStorage.setItem(SKIN_KEY, next)
  })

  // --- Save button (placeholder, wired up by content/reader.ts) ---
  const btnSave = shadow.getElementById('btn-save')!
  btnSave.addEventListener('click', () => {
    // Dispatch custom event for the content script handler
    const event = new CustomEvent('reader-save', {
      detail: { article },
      bubbles: false,
    })
    host.dispatchEvent(event)
  })

  // Set initial theme icon
  updateThemeIcon(btnTheme, overlay.getAttribute('data-theme') as Theme)
}

function updateThemeIcon(btn: HTMLElement, theme: Theme) {
  // Icon changes automatically via CSS, no need to swap SVG
  btn.title = theme === 'dark' ? '切换亮色模式' : '切换暗色模式'
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function injectStyles(shadow: ShadowRoot) {
  const style = document.createElement('style')
  style.textContent = getReaderStyles() + getArticleStyles()
  shadow.appendChild(style)
}

function getReaderStyles(): string {
  return /* css */`
    /* ===== Reset & Base ===== */
    :host {
      all: initial;
      /* Base font stacks (shared with local markdown viewer) */
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
      --font-serif: Charter, 'Bitstream Charter', 'Noto Serif SC', 'Source Han Serif SC', 'STSongti-SC', Georgia, serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .reader-overlay {
      all: initial;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      overflow: hidden;
      transition: background 0.3s, color 0.3s;
    }

    /* ===== Themes (shared) + Reader-specific overrides ===== */
    /* Color variables come from article-styles.ts */
    /* Reader-only variables: */
    .reader-overlay[data-theme="light"] {
      --bg-alt: #f5f2ee;
      --toolbar-bg: rgba(250, 248, 245, 0.92);
      --toc-bg: rgba(250, 248, 245, 0.7);
      --shadow: rgba(0,0,0,0.08);
    }
    .reader-overlay[data-theme="dark"] {
      --bg-alt: #222018;
      --toolbar-bg: rgba(26, 25, 21, 0.92);
      --toc-bg: rgba(26, 25, 21, 0.7);
      --shadow: rgba(0,0,0,0.3);
    }

    /* ===== Skins (shared) + Reader-specific skin overrides ===== */
    /* Variable definitions come from article-styles.ts */
    /* Reader-only skin styles below */

    /* Paper skin: parchment card for reader TOC */
    .reader-overlay[data-skin="paper"][data-theme="light"] .reader-toc {
      background: rgba(255, 252, 248, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.04);
      border-radius: 8px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.03);
    }
    .reader-overlay[data-skin="paper"][data-theme="dark"] .reader-toc {
      background: rgba(26, 25, 21, 0.7);
      border: 1px solid rgba(255,255,255,0.04);
      border-radius: 8px;
    }

    /* Grid skin: dot-grid background + floating TOC card */
    .reader-overlay[data-skin="grid"] {
      background-image:
        linear-gradient(var(--grid-color) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
      background-size: var(--grid-size) var(--grid-size);
    }
    .reader-overlay[data-skin="grid"][data-theme="light"] {
      --toc-card-bg: rgba(255, 255, 255, 0.82);
      --toc-card-border: rgba(0, 0, 0, 0.06);
      --toc-card-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0.5px 1px rgba(0,0,0,0.03);
    }
    .reader-overlay[data-skin="grid"][data-theme="dark"] {
      --toc-card-bg: rgba(18, 20, 28, 0.85);
      --toc-card-border: rgba(255, 255, 255, 0.06);
      --toc-card-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }
    .reader-overlay[data-skin="grid"] .reader-toc {
      background: var(--toc-card-bg);
      border: 1px solid var(--toc-card-border);
      border-radius: 10px;
      padding: 16px 12px;
      box-shadow: var(--toc-card-shadow);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    /* ===== Toolbar ===== */
    .reader-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 52px;
      padding: 0 16px;
      background: var(--toolbar-bg);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      user-select: none;
      position: relative;
      z-index: 1;
    }
    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 160px;
    }
    .toolbar-right {
      justify-content: flex-end;
    }
    .toolbar-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
      flex: 1;
    }
    .toolbar-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 400px;
    }
    .toolbar-source {
      font-size: 11px;
      color: var(--text-secondary);
    }
    .tb-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 13px;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .tb-btn:hover {
      background: var(--bg-alt);
      color: var(--text);
    }
    .tb-btn svg {
      flex-shrink: 0;
    }

    /* ===== Body ===== */
    .reader-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      background: var(--bg);
    }

    /* ===== TOC Sidebar ===== */
    .reader-toc {
      width: 240px;
      flex-shrink: 0;
      background: var(--toc-bg);
      border-right: 1px solid var(--border);
      overflow-y: auto;
      padding: 16px 0;
    }
    .toc-header {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      padding: 0 16px 12px;
    }
    .toc-nav {
      font-size: 13px;
    }
    .toc-nav ul {
      list-style: none;
      padding: 0;
    }
    .toc-nav .toc-item {
      padding: 0;
    }
    .toc-nav .toc-row {
      display: flex;
      align-items: flex-start;
      padding: 2px 16px;
      border-left: 2px solid transparent;
    }
    .toc-nav a {
      display: block;
      padding: 3px 0;
      color: var(--text-secondary);
      text-decoration: none;
      cursor: pointer;
      font-size: 13px;
      line-height: 1.4;
      transition: color 0.15s;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .toc-nav a:hover {
      color: var(--accent);
    }
    .toc-nav a.active {
      color: var(--accent);
      font-weight: 500;
    }
    .toc-nav .toc-row.active {
      border-left-color: var(--accent);
      background: var(--bg);
    }
    .toc-nav .toc-item.toc-hidden {
      display: none;
    }
    .toc-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      cursor: pointer;
      flex-shrink: 0;
      margin-top: 4px;
      color: var(--text-secondary);
      transition: transform 0.15s;
    }
    .toc-toggle.expanded {
      transform: rotate(90deg);
    }
    .toc-toggle svg {
      width: 12px;
      height: 12px;
    }
    .toc-toggle-placeholder {
      width: 18px;
      flex-shrink: 0;
    }

    /* ===== Article Content ===== */
    .reader-content {
      flex: 1;
      overflow-y: auto;
      padding: 40px 48px;
      display: flex;
      justify-content: center;
    }
    /* .md-article typography & .hljs theme → shared from article-styles.ts */

    /* ===== Toast ===== */
    .save-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--text);
      color: var(--bg);
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 2147483647;
      box-shadow: 0 4px 12px var(--shadow);
      animation: toast-in 0.25s ease;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    /* ===== Scrollbar ===== */
    .reader-content::-webkit-scrollbar,
    .reader-toc::-webkit-scrollbar {
      width: 4px;
    }
    .reader-content::-webkit-scrollbar-track,
    .reader-toc::-webkit-scrollbar-track {
      background: transparent;
    }
    .reader-content::-webkit-scrollbar-thumb,
    .reader-toc::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }
    .reader-content::-webkit-scrollbar-thumb:hover {
      background: var(--text-secondary);
    }
  `
}
