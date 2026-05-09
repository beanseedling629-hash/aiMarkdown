/**
 * Scroll Sync: Highlights the TOC item corresponding to the
 * currently visible heading. Auto-expands collapsed parents.
 *
 * Supports both normal document mode (local .md) and Shadow DOM mode (reader).
 */

export interface ScrollSyncOptions {
  /** The root to query headings from (document or ShadowRoot) */
  root?: Document | ShadowRoot
  /** The scroll container to observe (window or a specific element) */
  scrollContainer?: HTMLElement | Window
  /** Selector for the sidebar element (for scrolling TOC into view) */
  sidebarSelector?: string
}

export function initScrollSync(tocContainer: HTMLElement, options: ScrollSyncOptions = {}): void {
  const root = options.root || document
  const scrollContainer = options.scrollContainer || window
  const sidebarSelector = options.sidebarSelector || '#md-sidebar'

  const headings = root.querySelectorAll<HTMLElement>(
    '.md-article h1[id], .md-article h2[id], .md-article h3[id], .md-article h4[id], .md-article h5[id], .md-article h6[id]'
  )

  if (headings.length === 0) return

  const tocLinks = tocContainer.querySelectorAll<HTMLAnchorElement>('a[data-id]')
  const tocMap = new Map<string, HTMLAnchorElement>()
  tocLinks.forEach(link => {
    const id = link.getAttribute('data-id')
    if (id) tocMap.set(id, link)
  })

  const visibleHeadings = new Set<string>()

  // Determine the IntersectionObserver root element
  const observerRoot = scrollContainer instanceof HTMLElement ? scrollContainer : null

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const id = entry.target.id
        if (entry.isIntersecting) {
          visibleHeadings.add(id)
        } else {
          visibleHeadings.delete(id)
        }
      })

      // Find the topmost visible heading
      let activeId: string | null = null
      for (const heading of headings) {
        if (visibleHeadings.has(heading.id)) {
          activeId = heading.id
          break
        }
      }

      // Fallback: find the last heading above scroll position
      if (!activeId) {
        const scrollTop = getScrollTop(scrollContainer)
        for (let i = headings.length - 1; i >= 0; i--) {
          const headingTop = getElementTop(headings[i], scrollContainer)
          if (headingTop <= scrollTop + 100) {
            activeId = headings[i].id
            break
          }
        }
      }

      // Update active state
      if (activeId) {
        tocLinks.forEach(link => link.classList.remove('active'))
        tocContainer.querySelectorAll('.toc-row.active').forEach(row => row.classList.remove('active'))

        const activeLink = tocMap.get(activeId)
        if (activeLink) {
          activeLink.classList.add('active')
          const row = activeLink.closest('.toc-row')
          if (row) row.classList.add('active')
          autoExpandParent(activeLink, tocContainer)
          scrollTocIntoView(activeLink, root, sidebarSelector)
        }
      }
    },
    {
      root: observerRoot,
      rootMargin: '-60px 0px -70% 0px',
      threshold: 0,
    }
  )

  headings.forEach(heading => observer.observe(heading))

  // Smooth scroll on TOC click
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const id = link.getAttribute('data-id')
      if (!id) return
      // Find target in the correct root (document or shadow)
      const target = root.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })
}

function getScrollTop(container: HTMLElement | Window): number {
  if (container instanceof Window) return window.scrollY
  return container.scrollTop
}

function getElementTop(el: HTMLElement, container: HTMLElement | Window): number {
  if (container instanceof Window) return el.offsetTop
  return el.offsetTop - container.offsetTop
}

function autoExpandParent(link: HTMLElement, tocContainer: HTMLElement): void {
  const li = link.closest('.toc-item') as HTMLElement | null
  if (!li || !li.classList.contains('toc-hidden')) return

  const items = Array.from(tocContainer.querySelectorAll<HTMLElement>('.toc-item'))
  const index = items.indexOf(li)
  if (index < 0) return

  const myLevel = parseInt(li.dataset.level || '1')

  for (let i = index - 1; i >= 0; i--) {
    const ancestor = items[i]
    const ancestorLevel = parseInt(ancestor.dataset.level || '1')
    if (ancestorLevel < myLevel && !ancestor.classList.contains('toc-hidden')) {
      const toggle = ancestor.querySelector('.toc-toggle') as HTMLElement | null
      if (toggle && !toggle.classList.contains('expanded')) {
        toggle.click()
      }
      break
    }
  }
}

function scrollTocIntoView(
  link: HTMLElement,
  root: Document | ShadowRoot,
  sidebarSelector: string
): void {
  const sidebar = root.querySelector(sidebarSelector) as HTMLElement | null
  if (!sidebar) return

  const linkRect = link.getBoundingClientRect()
  const sidebarRect = sidebar.getBoundingClientRect()

  const isAbove = linkRect.top < sidebarRect.top + 10
  const isBelow = linkRect.bottom > sidebarRect.bottom - 10

  if (isAbove || isBelow) {
    const linkTop = linkRect.top - sidebarRect.top + sidebar.scrollTop
    const target = linkTop - sidebar.clientHeight / 3
    sidebar.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }
}
