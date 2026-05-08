import { renderMarkdown } from '../core/renderer'
import { buildTOC } from '../core/toc'
import { initTheme, toggleTheme, getCurrentTheme } from '../core/theme'
import { initScrollSync } from '../core/scroll-sync'

interface FileNode {
  name: string
  path: string
  handle: FileSystemFileHandle
}

interface FolderNode {
  name: string
  path: string
  children: (FileNode | FolderNode)[]
  expanded: boolean
}

let rootHandle: FileSystemDirectoryHandle | null = null
let fileTree: FolderNode | null = null
let currentFile: FileNode | null = null

async function init() {
  initTheme()
  renderApp()
}

function renderApp() {
  const app = document.getElementById('app')!
  app.innerHTML = `
    <div class="viewer-container" data-theme="${getCurrentTheme()}">
      <div class="viewer-welcome" id="welcome">
        <div class="welcome-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--accent)">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <h1>Markdown Viewer</h1>
          <p>Open a folder to browse and render Markdown files</p>
          <button class="btn-primary" id="btn-open">Open Folder</button>
        </div>
      </div>
      <div class="viewer-workspace" id="workspace" style="display:none">
        <aside class="file-sidebar" id="file-sidebar"></aside>
        <main class="file-main">
          <header class="file-toolbar">
            <span class="file-name" id="current-file-name">Select a file</span>
            <button class="md-btn" id="btn-theme" title="Toggle theme"></button>
          </header>
          <div class="file-content">
            <article id="file-article" class="md-article"></article>
          </div>
          <aside class="file-toc" id="file-toc">
            <div class="md-toc-header">Contents</div>
            <nav id="file-toc-nav" class="md-toc"></nav>
          </aside>
        </main>
      </div>
    </div>
  `
  addViewerStyles()
  bindEvents()
}

function bindEvents() {
  document.getElementById('btn-open')?.addEventListener('click', openFolder)
  document.getElementById('btn-theme')?.addEventListener('click', () => {
    toggleTheme()
    document.querySelector('.viewer-container')?.setAttribute('data-theme', getCurrentTheme())
  })
}

async function openFolder() {
  try {
    rootHandle = await (window as any).showDirectoryPicker()
    fileTree = await scanDirectory(rootHandle!, '')
    showWorkspace()
    renderFileTree()
  } catch (e) {
    // User cancelled
  }
}

async function scanDirectory(dirHandle: FileSystemDirectoryHandle, path: string): Promise<FolderNode> {
  const node: FolderNode = { name: dirHandle.name, path, children: [], expanded: true }

  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'file' && /\.(md|markdown|mdown)$/i.test(entry.name)) {
      node.children.push({
        name: entry.name,
        path: `${path}/${entry.name}`,
        handle: entry as FileSystemFileHandle,
      })
    } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
      const child = await scanDirectory(entry as FileSystemDirectoryHandle, `${path}/${entry.name}`)
      if (child.children.length > 0) {
        node.children.push(child)
      }
    }
  }

  // Sort: folders first, then files
  node.children.sort((a, b) => {
    const aIsFolder = 'children' in a
    const bIsFolder = 'children' in b
    if (aIsFolder && !bIsFolder) return -1
    if (!aIsFolder && bIsFolder) return 1
    return a.name.localeCompare(b.name)
  })

  return node
}

function showWorkspace() {
  document.getElementById('welcome')!.style.display = 'none'
  document.getElementById('workspace')!.style.display = 'flex'
}

function renderFileTree() {
  const sidebar = document.getElementById('file-sidebar')!
  sidebar.innerHTML = `<div class="sidebar-header">${fileTree?.name || 'Files'}</div>` + buildFileTreeHTML(fileTree!)
}

function buildFileTreeHTML(node: FolderNode): string {
  let html = '<ul class="file-tree">'
  for (const child of node.children) {
    if ('children' in child) {
      html += `<li class="tree-folder ${child.expanded ? 'expanded' : ''}">
        <span class="tree-label">${child.name}</span>
        ${buildFileTreeHTML(child)}
      </li>`
    } else {
      html += `<li class="tree-file" data-path="${child.path}">
        <span class="tree-label">${child.name}</span>
      </li>`
    }
  }
  html += '</ul>'

  // Bind click after next tick
  setTimeout(() => {
    document.querySelectorAll('.tree-file').forEach(el => {
      el.addEventListener('click', () => {
        const path = el.getAttribute('data-path')!
        const file = findFile(fileTree!, path)
        if (file) openFile(file)
      })
    })
    document.querySelectorAll('.tree-folder > .tree-label').forEach(el => {
      el.addEventListener('click', () => {
        el.parentElement?.classList.toggle('expanded')
      })
    })
  }, 0)

  return html
}

function findFile(node: FolderNode, path: string): FileNode | null {
  for (const child of node.children) {
    if ('children' in child) {
      const found = findFile(child, path)
      if (found) return found
    } else if (child.path === path) {
      return child
    }
  }
  return null
}

async function openFile(file: FileNode) {
  currentFile = file
  document.getElementById('current-file-name')!.textContent = file.name

  // Highlight active file
  document.querySelectorAll('.tree-file').forEach(el => el.classList.remove('active'))
  document.querySelector(`.tree-file[data-path="${file.path}"]`)?.classList.add('active')

  // Read and render
  const fileObj = await file.handle.getFile()
  const text = await fileObj.text()
  const { html, tocItems } = renderMarkdown(text)

  const article = document.getElementById('file-article')!
  article.innerHTML = html

  // Build TOC
  const tocNav = document.getElementById('file-toc-nav')!
  tocNav.innerHTML = buildTOC(tocItems, 2)

  // Init scroll sync
  initScrollSync(tocNav)
}

function addViewerStyles() {
  const style = document.createElement('style')
  style.textContent = `/* Inherit theme vars from content/index.ts styles */` // Will use CSS vars
  document.head.appendChild(style)
}

init()
