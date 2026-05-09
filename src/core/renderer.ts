import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import shell from 'highlight.js/lib/languages/shell'
import diff from 'highlight.js/lib/languages/diff'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import csharp from 'highlight.js/lib/languages/csharp'

// Register common languages
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c', cpp)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('diff', diff)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('php', php)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('rb', ruby)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('cs', csharp)
import { TOCItem } from './toc'

// Configure markdown-it with all features
const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
  highlight(str: string, lang: string): string {
    // If language specified and available, use it
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, { language: lang, ignoreIllegals: true })
        return `<pre class="hljs"><code class="language-${lang}">${highlighted.value}</code></pre>`
      } catch (_) { /* fallback */ }
    }
    // Auto-detect language when not specified
    if (!lang && str.trim().length > 0) {
      try {
        const result = hljs.highlightAuto(str)
        if (result.language) {
          return `<pre class="hljs"><code class="language-${result.language}">${result.value}</code></pre>`
        }
      } catch (_) { /* fallback */ }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  },
})

// Add anchor plugin for heading IDs
md.use(anchor, {
  permalink: false,
  slugify: (s: string) =>
    s.trim().toLowerCase()
      .replace(/[\s]+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, ''),
})

// Task list support
md.core.ruler.after('inline', 'task-list', (state) => {
  const tokens = state.tokens
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'inline') continue
    const children = tokens[i].children
    if (!children || children.length === 0) continue
    const first = children[0]
    if (first.type === 'text' && /^\[([ xX])\]\s/.test(first.content)) {
      const checked = first.content[1] !== ' '
      first.content = first.content.replace(/^\[([ xX])\]\s/, '')
      const checkbox = new state.Token('html_inline', '', 0)
      checkbox.content = `<input type="checkbox" disabled ${checked ? 'checked' : ''} />`
      children.unshift(checkbox)
    }
  }
})

// KaTeX inline math: $...$
const defaultRender = md.renderer.rules.text || ((tokens, idx) => tokens[idx].content)
md.renderer.rules.text = (tokens, idx, options, env, self) => {
  let content = tokens[idx].content
  // Inline math
  content = content.replace(/\$([^\$\n]+?)\$/g, (_match, formula) => {
    try {
      const katex = (window as any).katex
      if (katex) {
        return katex.renderToString(formula, { throwOnError: false })
      }
    } catch (_) { /* fallback */ }
    return `<code class="math-inline">${formula}</code>`
  })
  return content
}

export interface RenderResult {
  html: string
  tocItems: TOCItem[]
}

export function renderMarkdown(source: string): RenderResult {
  const html = md.render(source)

  // Extract headings from rendered HTML to ensure IDs match exactly
  const tocItems: TOCItem[] = []
  const headingPattern = /<h([1-6])\s+id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi
  let match: RegExpExecArray | null
  while ((match = headingPattern.exec(html)) !== null) {
    const level = parseInt(match[1])
    const id = match[2]
    // Strip HTML tags from heading text
    const text = match[3].replace(/<[^>]+>/g, '').trim()
    tocItems.push({ level, text, id })
  }

  return { html, tocItems }
}
