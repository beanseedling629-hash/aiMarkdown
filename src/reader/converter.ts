/**
 * HTML to Markdown conversion using Turndown.
 */
import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',       // ## heading
  codeBlockStyle: 'fenced',  // ```code```
  emDelimiter: '*',
  bulletListMarker: '-',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full',
})

// Better fenced code block: extract language from various class name formats
turndown.addRule('fenced-code-block', {
  filter: (node) => {
    return node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE'
  },
  replacement: (_content, node) => {
    const code = (node as HTMLElement).querySelector('code')!
    const text = code.textContent || ''
    const lang = extractLanguage(code.className || (node as HTMLElement).className || '')
    return `\n\n\`\`\`${lang}\n${text.replace(/\n$/, '')}\n\`\`\`\n\n`
  }
})

// Extract language from class names like "language-css", "hljs css", "highlight-source-js", etc.
function extractLanguage(className: string): string {
  if (!className) return ''
  // Try "language-xxx" pattern
  const langMatch = className.match(/language-(\w+)/)
  if (langMatch) return langMatch[1]
  // Try "hljs xxx" or just language name as class
  const classes = className.split(/\s+/).filter(c => c !== 'hljs' && c !== 'highlight' && c !== 'code-block')
  for (const cls of classes) {
    // Common language names
    if (/^(javascript|typescript|python|go|rust|java|c|cpp|csharp|ruby|php|swift|kotlin|html|css|scss|less|json|yaml|xml|sql|bash|shell|markdown|plaintext|text|jsx|tsx)$/i.test(cls)) {
      return cls.toLowerCase()
    }
    // "highlight-source-xxx" pattern
    const sourceMatch = cls.match(/(?:highlight-)?source-(\w+)/)
    if (sourceMatch) return sourceMatch[1]
  }
  return classes[0] || ''
}

// Preserve tables as raw HTML (better fidelity)
turndown.addRule('table', {
  filter: 'table',
  replacement: (_content, node) => {
    return '\n\n' + (node as HTMLElement).outerHTML + '\n\n'
  }
})

// Handle <picture> elements: extract image URL from inner <img> or <source>
turndown.addRule('picture', {
  filter: 'picture',
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const img = el.querySelector('img')

    // Priority 1: use img src (extractor already fixed lazy-load attrs)
    let bestUrl = ''
    if (img) {
      bestUrl = img.getAttribute('src') || ''
    }

    // Priority 2: try source srcset
    if (!bestUrl || bestUrl.length < 10 || bestUrl.startsWith('data:')) {
      const sources = el.querySelectorAll('source')
      for (const source of sources) {
        const srcset = source.getAttribute('srcset')
        if (srcset) {
          const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]).filter(u => u.startsWith('http'))
          if (urls.length > 0) { bestUrl = urls[urls.length - 1]; break }
        }
      }
    }

    if (!bestUrl || bestUrl.length < 10) return ''
    const alt = img?.getAttribute('alt') || ''
    return `\n\n![${alt}](${bestUrl})\n\n`
  }
})

    if (!bestUrl) return ''

    const alt = img?.getAttribute('alt') || ''
    return `\n\n![${alt}](${bestUrl})\n\n`
  }
})

// Enhanced img: use srcset if src is empty/tiny
turndown.addRule('img-srcset', {
  filter: (node) => {
    if (node.nodeName !== 'IMG') return false
    const src = (node as HTMLElement).getAttribute('src') || ''
    const srcset = (node as HTMLElement).getAttribute('srcset') || ''
    // Only apply if src is missing/tiny and srcset exists
    return (!src || src.length < 10 || src.startsWith('data:')) && srcset.length > 0
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const srcset = el.getAttribute('srcset') || ''
    const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]).filter(u => u.startsWith('http'))
    const bestUrl = urls[urls.length - 1] || ''
    if (!bestUrl) return ''
    const alt = el.getAttribute('alt') || ''
    return `![${alt}](${bestUrl})`
  }
})

// Fallback: ensure all <img> with valid src are converted to markdown
// This overrides Turndown's default img handling to be more robust
turndown.addRule('img-fallback', {
  filter: 'img',
  replacement: (_content, node) => {
    const el = node as HTMLElement
    const src = el.getAttribute('src') || ''
    if (!src || src.length < 10 || src.startsWith('data:')) return ''
    const alt = el.getAttribute('alt') || ''
    return `![${alt}](${src})`
  }
})

// Keep <kbd>, <samp>, <var> inline
turndown.addRule('inline-semantic', {
  filter: ['kbd', 'samp', 'var'],
  replacement: (content) => `\`${content}\``
})

// Remove empty paragraphs
turndown.addRule('empty-paragraph', {
  filter: (node) => {
    return node.nodeName === 'P' && node.textContent?.trim() === ''
  },
  replacement: () => ''
})

/**
 * Convert clean article HTML to Markdown.
 */
export function convertToMarkdown(html: string): string {
  return turndown.turndown(html)
}

/**
 * Get the article title formatted as a Markdown heading.
 */
export function titleToMarkdown(title: string): string {
  return `# ${title}\n\n`
}

/**
 * Get metadata lines for the top of the markdown file.
 */
export function metadataToMarkdown(article: {
  title: string
  byline: string
  siteName: string
  excerpt: string
}): string {
  const lines: string[] = []
  lines.push(`> **${article.title}**`)
  if (article.byline) lines.push(`> 作者: ${article.byline}`)
  if (article.siteName) lines.push(`> 来源: ${article.siteName}`)
  lines.push(`> 原文: ${window.location.href}`)
  lines.push(`> 保存日期: ${new Date().toISOString().split('T')[0]}`)
  if (article.excerpt) lines.push(`> ${article.excerpt}`)
  lines.push('')
  return lines.join('\n')
}
