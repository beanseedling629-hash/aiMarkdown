export interface TOCItem {
  level: number
  text: string
  id: string
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Build TOC HTML with collapsible tree structure.
 * @param items - Heading items extracted from rendered HTML
 * @param defaultExpandDepth - Relative depth to expand by default (e.g., 2 = show h1 + h2)
 */
export function buildTOC(items: TOCItem[], defaultExpandDepth: number = 2): string {
  if (items.length === 0) return ''

  const minLevel = Math.min(...items.map(i => i.level))

  // Determine which items have children
  const hasChildren = new Set<number>()
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[j].level <= items[i].level) break
      if (items[j].level > items[i].level) {
        hasChildren.add(i)
        break
      }
    }
  }

  let html = '<ul>'
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const relativeLevel = item.level - minLevel + 1
    const isHidden = relativeLevel > defaultExpandDepth
    const hasChild = hasChildren.has(i)

    // A parent item is "expanded" if its direct children are visible
    // Children at depth <= defaultExpandDepth are visible, so parent is expanded
    // if parent's relativeLevel < defaultExpandDepth
    const isExpanded = hasChild && (relativeLevel < defaultExpandDepth)

    html += `<li class="toc-item toc-level-${item.level}${isHidden ? ' toc-hidden' : ''}" data-level="${item.level}">`
    html += `<div class="toc-row">`

    if (hasChild) {
      html += `<span class="toc-toggle${isExpanded ? ' expanded' : ''}" aria-label="展开/收起"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg></span>`
    } else {
      html += `<span class="toc-toggle-placeholder"></span>`
    }

    html += `<a data-level="${item.level}" data-id="${item.id}" role="button" tabindex="0">${escapeHtml(item.text)}</a>`
    html += `</div></li>`
  }
  html += '</ul>'
  return html
}

/**
 * Initialize TOC collapse/expand behavior.
 * Only the toggle arrow triggers expand/collapse.
 */
export function initTOCCollapse(tocEl: HTMLElement): void {
  tocEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    // Only the toggle button triggers expand/collapse
    const toggle = target.closest('.toc-toggle') as HTMLElement | null
    if (!toggle) return

    e.preventDefault()
    e.stopPropagation()
    toggleItem(toggle, tocEl)
  })
}

function toggleItem(toggle: HTMLElement, tocEl: HTMLElement): void {
  const li = toggle.closest('.toc-item') as HTMLElement | null
  if (!li) return

  const currentLevel = parseInt(li.dataset.level || '1')
  const isExpanded = toggle.classList.contains('expanded')
  const items = Array.from(tocEl.querySelectorAll('.toc-item')) as HTMLElement[]
  const index = items.indexOf(li)
  if (index < 0) return

  // Toggle the expand state
  toggle.classList.toggle('expanded')

  // Show/hide children
  for (let i = index + 1; i < items.length; i++) {
    const child = items[i]
    const childLevel = parseInt(child.dataset.level || '1')

    if (childLevel <= currentLevel) break

    if (isExpanded) {
      // Collapsing: hide all descendants
      child.classList.add('toc-hidden')
      const childToggle = child.querySelector('.toc-toggle.expanded')
      if (childToggle) childToggle.classList.remove('expanded')
    } else {
      // Expanding: only show direct children (one level deeper)
      if (childLevel === currentLevel + 1) {
        child.classList.remove('toc-hidden')
      }
    }
  }
}
