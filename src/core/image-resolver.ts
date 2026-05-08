/**
 * Resolve local images with relative paths.
 * Since we're in file:// context, we can construct the absolute file:// URL
 * based on the markdown file's location.
 */
export function resolveLocalImages(container: HTMLElement, fileUrl: string): void {
  const baseDir = fileUrl.substring(0, fileUrl.lastIndexOf('/') + 1)
  const images = container.querySelectorAll<HTMLImageElement>('img')

  images.forEach(img => {
    const src = img.getAttribute('src')
    if (!src) return

    // Skip absolute URLs (http://, https://, data:, file://)
    if (/^(https?:|data:|file:|blob:)/i.test(src)) return

    // Resolve relative path against the markdown file's directory
    const absoluteUrl = new URL(src, baseDir).href
    img.setAttribute('src', absoluteUrl)

    // Add error handling
    img.addEventListener('error', () => {
      img.style.opacity = '0.5'
      img.alt = `[Image not found: ${src}]`
      img.title = `Failed to load: ${absoluteUrl}`
    })
  })
}
