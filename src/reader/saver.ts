/**
 * Article Saver - saves articles to extension internal storage.
 * Downloads images, stores them in IndexedDB, saves markdown + metadata.
 */
import { saveArticle, generateId, estimateReadTime } from '../storage/article-store'
import type { SavedArticle, ImageRef } from '../storage/article-store'
import { saveImage } from '../storage/image-store'
import type { StoredImage } from '../storage/image-store'

export interface SaveOptions {
  title: string
  url: string
  markdown: string
  imageUrls: string[]
  excerpt?: string
  favicon?: string
}

export interface SaveProgress {
  phase: 'images' | 'storing' | 'done'
  current: number
  total: number
}

/**
 * Save an article to internal storage with all images.
 */
export async function saveArticleToLibrary(
  options: SaveOptions,
  onProgress?: (progress: SaveProgress) => void
): Promise<SavedArticle> {
  const articleId = generateId()
  const imageRefs: ImageRef[] = []
  let markdown = options.markdown

  // Download and store images
  if (options.imageUrls.length > 0) {
    const total = options.imageUrls.length
    for (let i = 0; i < total; i++) {
      onProgress?.({ phase: 'images', current: i + 1, total })

      const url = options.imageUrls[i]
      try {
        const blob = await downloadImage(url)
        if (blob) {
          const ext = getExtFromMime(blob.type) || getExtFromUrl(url) || 'png'
          const filename = `img-${i + 1}.${ext}`
          const key = `${articleId}/${filename}`

          // Store blob in IndexedDB
          const storedImage: StoredImage = {
            key,
            blob,
            mimeType: blob.type,
            articleId,
          }
          await saveImage(storedImage)

          // Track reference
          imageRefs.push({ key, originalUrl: url, filename })

          // Replace URL in markdown
          const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          markdown = markdown.replace(new RegExp(escapedUrl, 'g'), `idb://${key}`)
        }
      } catch {
        // Skip failed images, keep original URL
      }
    }
  }

  onProgress?.({ phase: 'storing', current: 0, total: 0 })

  // Build article object
  const article: SavedArticle = {
    id: articleId,
    title: options.title,
    url: options.url,
    savedAt: Date.now(),
    markdown,
    images: imageRefs,
    group: 'unread',
    excerpt: options.excerpt || markdown.slice(0, 200).replace(/[#*_\[\]]/g, ''),
    readTime: estimateReadTime(markdown),
    favicon: options.favicon,
  }

  // Save to chrome.storage.local
  await saveArticle(article)

  onProgress?.({ phase: 'done', current: 0, total: 0 })
  return article
}

/** Download an image and return as Blob */
async function downloadImage(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return null
    return await response.blob()
  } catch {
    return null
  }
}

function getExtFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
  }
  return map[mime] || null
}

function getExtFromUrl(url: string): string | null {
  const match = url.match(/\.([a-z]{3,4})(?:[?#]|$)/i)
  return match ? match[1].toLowerCase() : null
}

/** Extract image URLs from markdown text */
export function extractImageUrls(markdown: string): string[] {
  const urls: string[] = []
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g
  let match
  while ((match = regex.exec(markdown)) !== null) {
    const url = match[1].trim()
    if (url.startsWith('http://') || url.startsWith('https://')) {
      urls.push(url)
    }
  }
  return [...new Set(urls)]
}
