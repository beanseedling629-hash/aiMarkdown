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
