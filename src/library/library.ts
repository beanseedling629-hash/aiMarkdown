/**
 * Library page - reading list with groups, drag-and-drop, and article reader.
 */
import { getAllArticles, deleteArticle, moveToGroup, type SavedArticle } from '../storage/article-store'
import { getAllGroups, addGroup, deleteGroup, type Group } from '../storage/group-store'
import { deleteArticleImages } from '../storage/image-store'

let articles: SavedArticle[] = []
let groups: Group[] = []
let currentGroup: string | null = null // null = show all
let searchQuery = ''

// Inject library styles
const styleEl = document.createElement('style')
styleEl.textContent = getLibraryStyles()
document.head.appendChild(styleEl)

// Init
async function init() {
  articles = await getAllArticles()
  groups = await getAllGroups()
  renderGroups()
  renderArticles()
  setupEventListeners()
}

function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('search-input') as HTMLInputElement
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase()
    renderArticles()
  })

  // Add group
  document.getElementById('add-group-btn')!.addEventListener('click', async () => {
    const name = prompt('请输入分组名称：')
    if (name?.trim()) {
      await addGroup(name.trim())
      groups = await getAllGroups()
      renderGroups()
    }
  })
}

// ===== RENDER GROUPS =====
function renderGroups() {
  const list = document.getElementById('group-list')!
  list.innerHTML = ''

  // "All" item
  const allItem = document.createElement('li')
  allItem.className = `group-item${currentGroup === null ? ' active' : ''}`
  allItem.innerHTML = `📂 全部 <span class="group-count">${articles.length}</span>`
  allItem.addEventListener('click', () => { currentGroup = null; renderGroups(); renderArticles() })
  allItem.addEventListener('dragover', (e) => { e.preventDefault(); allItem.classList.add('drag-over') })
  allItem.addEventListener('dragleave', () => allItem.classList.remove('drag-over'))
  allItem.addEventListener('drop', (e) => handleGroupDrop(e, 'unread', allItem))
  list.appendChild(allItem)

  // Group items
  for (const group of groups) {
    const count = articles.filter(a => a.group === group.id).length
    const li = document.createElement('li')
    li.className = `group-item${currentGroup === group.id ? ' active' : ''}`
    li.innerHTML = `📁 ${escapeHtml(group.name)} <span class="group-count">${count}</span>`

    // Click to filter
    li.addEventListener('click', () => { currentGroup = group.id; renderGroups(); renderArticles() })

    // Drop target for drag
    li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('drag-over') })
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'))
    li.addEventListener('drop', (e) => handleGroupDrop(e, group.id, li))

    // Right-click to delete group
    if (group.id !== 'unread') {
      li.addEventListener('contextmenu', async (e) => {
        e.preventDefault()
        if (confirm(`删除分组「${group.name}」？文章将移到"待读"。`)) {
          // Move articles to unread
          const groupArticles = articles.filter(a => a.group === group.id)
          for (const a of groupArticles) await moveToGroup(a.id, 'unread')
          await deleteGroup(group.id)
          articles = await getAllArticles()
          groups = await getAllGroups()
          currentGroup = null
          renderGroups()
          renderArticles()
        }
      })
    }

    list.appendChild(li)
  }
}

function handleGroupDrop(e: DragEvent, groupId: string, el: HTMLElement) {
  e.preventDefault()
  el.classList.remove('drag-over')
  const articleId = e.dataTransfer?.getData('text/plain')
  if (articleId) {
    moveToGroup(articleId, groupId).then(async () => {
      articles = await getAllArticles()
      renderGroups()
      renderArticles()
    })
  }
}

// ===== RENDER ARTICLES =====
function renderArticles() {
  const container = document.getElementById('article-list')!
  const emptyState = document.getElementById('empty-state')!

  let filtered = articles
  if (currentGroup) {
    filtered = filtered.filter(a => a.group === currentGroup)
  }
  if (searchQuery) {
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(searchQuery) ||
      a.excerpt.toLowerCase().includes(searchQuery)
    )
  }

  if (filtered.length === 0) {
    container.innerHTML = ''
    emptyState.style.display = 'flex'
    return
  }

  emptyState.style.display = 'none'
  container.innerHTML = filtered.map(article => `
    <div class="article-card" draggable="true" data-id="${article.id}">
      <div class="article-card-main">
        <h3 class="article-title">${escapeHtml(article.title)}</h3>
        <p class="article-excerpt">${escapeHtml(article.excerpt)}</p>
        <div class="article-meta">
          <span class="article-source">${escapeHtml(getDomain(article.url))}</span>
          <span class="article-date">${formatDate(article.savedAt)}</span>
          <span class="article-readtime">${article.readTime} min</span>
        </div>
      </div>
      <button class="article-delete-btn" data-id="${article.id}" title="删除">×</button>
    </div>
  `).join('')

  // Attach event listeners
  container.querySelectorAll('.article-card').forEach(card => {
    const id = (card as HTMLElement).dataset.id!

    // Click to read
    card.querySelector('.article-card-main')!.addEventListener('click', () => openReader(id))

    // Drag start
    card.addEventListener('dragstart', (e) => {
      ;(e as DragEvent).dataTransfer?.setData('text/plain', id)
      ;(card as HTMLElement).classList.add('dragging')
    })
    card.addEventListener('dragend', () => {
      ;(card as HTMLElement).classList.remove('dragging')
    })
  })

  // Delete buttons
  container.querySelectorAll('.article-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const id = (btn as HTMLElement).dataset.id!
      if (confirm('确定删除这篇文章？')) {
        await deleteArticle(id)
        await deleteArticleImages(id)
        articles = await getAllArticles()
        renderGroups()
        renderArticles()
      }
    })
  })
}

// ===== ARTICLE READER =====
async function openReader(id: string) {
  const readerUrl = chrome.runtime.getURL('reader-page.html') + `?id=${id}`
  chrome.tabs.create({ url: readerUrl })
}

// ===== HELPERS =====
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getLibraryStyles(): string {
  return /* css */`
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  background: #f8f9fa;
  color: #1a1a1a;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}
.logo { font-size: 18px; font-weight: 600; }
.search-input {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  width: 260px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: #4a9eff; box-shadow: 0 0 0 3px rgba(74,158,255,0.1); }

.main-layout {
  display: flex;
  min-height: calc(100vh - 65px);
}

/* Sidebar */
.sidebar {
  width: 200px;
  background: #fafbfc;
  border-right: 1px solid #eef0f2;
  padding: 20px 0;
  flex-shrink: 0;
}
.sidebar-header {
  padding: 0 16px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.group-list { list-style: none; }
.group-item {
  padding: 9px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.12s;
  border-left: 3px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}
.group-item:hover { background: #f0f2f5; color: #333; }
.group-item.active { background: #eef4ff; color: #1a6ddb; border-left-color: #1a6ddb; font-weight: 600; }
.group-item.drag-over { background: #e3f2fd; border-left-color: #1a73e8; }
.group-item .group-count {
  margin-left: auto;
  font-size: 11px;
  background: #eee;
  color: #888;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
}
.group-item.active .group-count { background: #d4e5ff; color: #1a6ddb; }
.add-group-btn {
  margin: 16px 16px 0;
  padding: 8px 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
  width: calc(100% - 32px);
  transition: all 0.15s;
  text-align: center;
}
.add-group-btn:hover { color: #1a73e8; background: #f0f7ff; }

/* Article List */
.content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  background: #f8f9fb;
}
.article-list { display: flex; flex-direction: column; gap: 8px; max-width: 780px; }
.article-card {
  display: flex;
  align-items: flex-start;
  padding: 14px 18px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  cursor: grab;
  transition: all 0.12s;
  position: relative;
}
.article-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border-color: #e0e4e8;
  transform: translateY(-1px);
}
.article-card.dragging { opacity: 0.4; transform: scale(0.98); }
.article-card-main { flex: 1; cursor: pointer; min-width: 0; }
.article-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.article-card:hover .article-title { color: #1a6ddb; }
.article-excerpt {
  font-size: 12.5px;
  color: #777;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
}
.article-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #aaa;
}
.article-meta span { display: flex; align-items: center; gap: 3px; }
.article-delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: transparent;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.article-card:hover .article-delete-btn { color: #ccc; }
.article-delete-btn:hover { background: #fee; color: #e74c3c !important; }

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #bbb;
}
.empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.6; }
.empty-hint { font-size: 12px; margin-top: 8px; color: #ccc; }
.empty-hint kbd {
  background: #f5f5f5;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 11px;
  border: 1px solid #e8e8e8;
  font-family: monospace;
}

@media (max-width: 768px) {
  .sidebar { display: none; }
  .content { padding: 16px; }
}
`
}

// Start
init()
