/**
 * Image downloader with CORS fallback.
 *
 * Strategy:
 * 1. Try fetch(url) from content script (with page credentials)
 * 2. If CORS blocked → return null (URL will remain in markdown)
 * 3. Returns mapping of URL → downloaded blob (or null if failed)
 */

export interface ImageResult {
  url: string
  blob: Blob | null
  filename: string
}

const FETCH_TIMEOUT = 8000

/**
 * Attempt to download a single image.
 * Returns blob on success, null on failure (CORS, timeout, etc.)
 */
async function downloadImage(url: string): Promise<Blob | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    const response = await fetch(url, {
      credentials: 'include',
      signal: controller.signal,
      headers: { 'Accept': 'image/webp,image/*,*/*' }
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const blob = await response.blob()
    // Validate it's actually an image
    if (!blob.type.startsWith('image/')) return null
    if (blob.size === 0) return null
    return blob
  } catch {
    return null
  }
}

/**
 * Generate a safe filename from image URL.
 */
function imageFilename(url: string, index: number): string {
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  const basename = pathname.split('/').pop() || `image-${index}`

  // Sanitize: keep only safe chars, ensure extension
  let name = basename.replace(/[^a-zA-Z0-9._-]/g, '_')
  if (!/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(name)) {
    // Try to determine extension from content-type later, default to .png
    name += '.png'
  }
  return `${index.toString().padStart(3, '0')}-${name}`
}

/**
 * Download all images from the article HTML.
 * 
 * @param imageUrls - Array of absolute image URLs extracted from article
 * @returns Array of ImageResult (blob is null for failed downloads)
 */
export async function downloadImages(imageUrls: string[]): Promise<ImageResult[]> {
  const results: ImageResult[] = []
  const concurrency = 5 // limit parallel downloads

  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((url, batchIdx) => downloadImage(url).then(blob => ({
        url,
        blob,
        filename: imageFilename(url, i + batchIdx + 1),
      })))
    )
    results.push(...batchResults)
  }

  const successCount = results.filter(r => r.blob !== null).length
  const failCount = results.filter(r => r.blob === null).length
  console.log(`[Reader] Downloaded ${successCount}/${imageUrls.length} images (${failCount} failed, URLs kept in markdown)`)

  return results
}

/**
 * Replace image URLs in markdown text with local asset paths.
 * For failed downloads, keeps the original URL.
 */
export function replaceImageRefs(
  markdown: string,
  imageResults: ImageResult[]
): string {
  let result = markdown
  for (const img of imageResults) {
    if (img.blob) {
      // Replace markdown image reference with local path
      const escapedUrl = img.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Match ![alt](url) and <img src="url">
      result = result.replace(
        new RegExp(`\\!\\(\\[.*?\\]\\(${escapedUrl}\\)`, 'g'),
        `![${img.filename}]`
      )
      // Also replace plain img tags
      result = result.replace(
        new RegExp(`<img[^>]+src=["']${escapedUrl}["'][^>]*>`, 'gi'),
        `![${img.filename}](assets/${img.filename})`
      )
    }
  }
  return result
}
