/**
 * Hotkey listener for all http/https pages:
 * - Double "a" → trigger reading mode
 * - Double "s" → open quick search overlay (recent articles + search)
 */

let lastKeyTime = 0
let lastKey = ''

document.addEventListener('keydown', (e) => {
  // Ignore in inputs
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
    // Exception: allow ESC to close search overlay even in inputs
    if (e.key === 'Escape') closeSearchOverlay()
    return
  }

  const now = Date.now()

  // Number keys 1-5 to quickly open search results
  if (e.key >= '1' && e.key <= '5' && isSearchOverlayOpen()) {
    e.preventDefault()
    selectSearchItem(parseInt(e.key) - 1)
    return
  }

  // ESC to close search overlay
  if (e.key === 'Escape') {
    closeSearchOverlay()
    return
  }

  if (now - lastKeyTime > 400) {
    lastKey = e.key
    lastKeyTime = now
    return
  }

  if (e.key === 'a' && lastKey === 'a') {
    e.preventDefault()
    chrome.runtime.sendMessage({ type: 'TOGGLE_READING_MODE' })
    lastKey = ''
    lastKeyTime = 0
  } else if (e.key === 's' && lastKey === 's') {
    e.preventDefault()
    toggleSearchOverlay()
    lastKey = ''
    lastKeyTime = 0
  } else {
    lastKey = e.key
    lastKeyTime = now
  }
})

// ===== Search Overlay =====
let searchOverlay: HTMLElement | null = null
let searchArticles: any[] = []

function isSearchOverlayOpen(): boolean {
  return searchOverlay !== null && searchOverlay.style.display !== 'none'
}

function toggleSearchOverlay() {
  if (isSearchOverlayOpen()) {
    closeSearchOverlay()
  } else {
    openSearchOverlay()
  }
}

async function openSearchOverlay() {
  // Load articles from storage
  const result = await chrome.storage.local.get('saved_articles')
  searchArticles = (result.saved_articles || []).slice(0, 20) // cache top 20

  if (!searchOverlay) {
    createSearchOverlay()
  }

  searchOverlay!.style.display = 'flex'
  const input = searchOverlay!.querySelector('.qs-input') as HTMLInputElement
  input.value = ''
  input.focus()
  renderSearchResults('')
}

function closeSearchOverlay() {
  if (searchOverlay) {
    searchOverlay.style.display = 'none'
  }
}

function selectSearchItem(index: number) {
  const items = searchOverlay?.querySelectorAll('.qs-item')
  if (items && items[index]) {
    const id = (items[index] as HTMLElement).dataset.id
    if (id) {
      const url = chrome.runtime.getURL('reader-page.html') + `?id=${id}`
      chrome.runtime.sendMessage({ type: 'OPEN_READER_PAGE', url: `reader-page.html?id=${id}` })
      closeSearchOverlay()
    }
  }
}

function createSearchOverlay() {
  searchOverlay = document.createElement('div')
  searchOverlay.id = 'ai-md-search-overlay'
  searchOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 15vh; z-index: 2147483646;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `

  const panel = document.createElement('div')
  panel.style.cssText = `
    width: 520px; max-width: 90vw; background: #fff; border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
    overflow: hidden; animation: qs-in 0.15s ease;
  `
  panel.innerHTML = `
    <style>
      @keyframes qs-in { from { opacity:0; transform:translateY(-10px) scale(0.98); } to { opacity:1; transform:none; } }
      .qs-input {
        width: 100%; padding: 16px 20px; border: none; outline: none;
        font-size: 16px; background: transparent; color: #1a1a1a;
        border-bottom: 1px solid #f0f0f0;
      }
      .qs-input::placeholder { color: #bbb; }
      .qs-list { max-height: 320px; overflow-y: auto; padding: 8px 0; }
      .qs-item {
        display: flex; align-items: center; padding: 10px 20px; cursor: pointer;
        transition: background 0.1s; gap: 12px;
      }
      .qs-item:hover, .qs-item.qs-active { background: #f5f7fa; }
      .qs-num {
        width: 20px; height: 20px; border-radius: 4px; background: #f0f0f0;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 600; color: #888; flex-shrink: 0;
      }
      .qs-item:hover .qs-num, .qs-item.qs-active .qs-num { background: #e3f2fd; color: #1a73e8; }
      .qs-title {
        flex: 1; font-size: 14px; color: #333; white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis;
      }
      .qs-meta { font-size: 11px; color: #aaa; flex-shrink: 0; }
      .qs-empty { padding: 24px; text-align: center; color: #bbb; font-size: 13px; }
      .qs-hint { padding: 8px 20px; font-size: 11px; color: #bbb; border-top: 1px solid #f0f0f0; }
    </style>
    <input class="qs-input" placeholder="搜索已保存的文章..." autofocus />
    <div class="qs-list"></div>
    <div class="qs-hint">按 1-5 快速打开 · ESC 关闭 · aa 阅读模式</div>
  `

  searchOverlay.appendChild(panel)
  document.body.appendChild(searchOverlay)

  // Click backdrop to close
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearchOverlay()
  })

  // Search input
  const input = panel.querySelector('.qs-input') as HTMLInputElement
  input.addEventListener('input', () => {
    renderSearchResults(input.value.trim().toLowerCase())
  })

  // Enter to open first item
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      selectSearchItem(0)
    } else if (e.key === 'Escape') {
      closeSearchOverlay()
    }
  })
}

function renderSearchResults(query: string) {
  const list = searchOverlay?.querySelector('.qs-list')
  if (!list) return

  let filtered = searchArticles
  if (query) {
    filtered = searchArticles.filter(a =>
      a.title.toLowerCase().includes(query) ||
      (a.excerpt || '').toLowerCase().includes(query)
    )
  }

  const items = filtered.slice(0, 5)

  if (items.length === 0) {
    list.innerHTML = '<div class="qs-empty">没有找到匹配的文章</div>'
    return
  }

  list.innerHTML = items.map((article, i) => `
    <div class="qs-item" data-id="${article.id}">
      <span class="qs-num">${i + 1}</span>
      <span class="qs-title">${escHtml(article.title)}</span>
      <span class="qs-meta">${getDomain(article.url)}</span>
    </div>
  `).join('')

  // Click to open
  list.querySelectorAll('.qs-item').forEach((item, i) => {
    item.addEventListener('click', () => selectSearchItem(i))
  })
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return '' }
}
