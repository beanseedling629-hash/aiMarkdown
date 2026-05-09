/**
 * Article extraction using Mozilla's Readability.
 * Runs in content script context, needs access to page DOM.
 */
import { Readability } from '@mozilla/readability'

export interface ArticleResult {
  title: string
  content: string
  textContent: string
  excerpt: string
  byline: string
  siteName: string
  length: number
}

/**
 * Extract article content from the current page.
 * Clones the document to avoid mutating the original page.
 * Returns null if no article could be extracted.
 */
export function extractArticle(): ArticleResult | null {
  try {
    // Clone document to prevent Readability from mutating original DOM
    const doc = document.cloneNode(true) as Document

    // Remove script and style elements from clone for cleaner extraction
    const scripts = doc.querySelectorAll('script, style, noscript, svg')
    scripts.forEach(el => el.remove())

    const reader = new Readability(doc)
    const article = reader.parse()

    if (!article || !article.content) {
      console.warn('[Reader] No article content extracted')
      return null
    }

    return {
      title: article.title || document.title || 'Untitled',
      content: article.content,
      textContent: article.textContent || '',
      excerpt: article.excerpt || '',
      byline: article.byline || '',
      siteName: article.siteName || '',
      length: article.length || 0,
    }
  } catch (e) {
    console.error('[Reader] Extraction failed:', e)
    return null
  }
}

/**
 * Extract all image URLs from the article HTML for later processing.
 */
export function extractImages(html: string): string[] {
  const urls: string[] = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1]
    // Skip data URIs and blob URLs
    if (/^(data:|blob:|javascript:)/i.test(src)) continue
    // Resolve relative URLs
    try {
      const absolute = new URL(src, window.location.href).href
      urls.push(absolute)
    } catch {
      urls.push(src)
    }
  }
  return [...new Set(urls)] // deduplicate
}
