/**
 * Scroll Sync: Highlights the TOC item corresponding to the
 * currently visible heading. Auto-expands collapsed parents.
 */
export function initScrollSync(tocContainer: HTMLElement): void {
  const headings = document.querySelectorAll<HTMLElement>(
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

      // Fallback: find the last heading above viewport
      if (!activeId) {
        const scrollTop = window.scrollY
        for (let i = headings.length - 1; i >= 0; i--) {
          if (headings[i].offsetTop <= scrollTop + 100) {
            activeId = headings[i].id
            break
          }
        }
      }

      // Update active state
      if (activeId) {
        tocLinks.forEach(link => link.classList.remove('active'))
        const activeLink = tocMap.get(activeId)
        if (activeLink) {
          activeLink.classList.add('active')
          // Auto-expand parent if item is hidden
          autoExpandParent(activeLink, tocContainer)
          scrollTocIntoView(activeLink, tocContainer)
        }
      }
    },
    {
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
      const target = document.getElementById(id)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })
}

/**
 * If the active TOC item is hidden (inside a collapsed parent),
 * expand its parent chain so it becomes visible.
 */
function autoExpandParent(link: HTMLElement, tocContainer: HTMLElement): void {
  const li = link.closest('.toc-item') as HTMLElement | null
  if (!li || !li.classList.contains('toc-hidden')) return

  // Walk backward through items to find the parent that is collapsed
  const items = Array.from(tocContainer.querySelectorAll<HTMLElement>('.toc-item'))
  const index = items.indexOf(li)
  if (index < 0) return

  const myLevel = parseInt(li.dataset.level || '1')

  // Find the closest ancestor (lower level) that is visible
  for (let i = index - 1; i >= 0; i--) {
    const ancestor = items[i]
    const ancestorLevel = parseInt(ancestor.dataset.level || '1')
    if (ancestorLevel < myLevel && !ancestor.classList.contains('toc-hidden')) {
      // Click its toggle to expand
      const toggle = ancestor.querySelector('.toc-toggle') as HTMLElement | null
      if (toggle && !toggle.classList.contains('expanded')) {
        toggle.click()
      }
      break
    }
  }
}

function scrollTocIntoView(link: HTMLElement, _container: HTMLElement): void {
  const sidebar = document.getElementById('md-sidebar')
  if (!sidebar) return

  const linkRect = link.getBoundingClientRect()
  const sidebarRect = sidebar.getBoundingClientRect()

  // If active link is outside sidebar's visible area, scroll it into view
  const isAbove = linkRect.top < sidebarRect.top + 10
  const isBelow = linkRect.bottom > sidebarRect.bottom - 10

  if (isAbove || isBelow) {
    // Calculate where the link is relative to sidebar's scroll area
    const linkTop = linkRect.top - sidebarRect.top + sidebar.scrollTop
    // Scroll so the active item is at ~1/3 from the top
    const target = linkTop - sidebar.clientHeight / 3
    sidebar.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }
}
