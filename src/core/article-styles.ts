/**
 * Shared article styles – used by both local markdown viewer
 * (content/index.ts) and reading mode (reader/reader-ui.ts).
 *
 * Single source of truth for .md-article typography, code blocks,
 * highlight.js theme, and base CSS variables.
 */

export function getArticleStyles(): string {
  return `
/* ============================================ */
/* SHARED BASE VARIABLES                        */
/* ============================================ */
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  --font-serif: Charter, 'Bitstream Charter', 'Noto Serif SC', 'Source Han Serif SC', 'STSongti-SC', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace;
  --content-max-width: 720px;
  --radius: 8px;
  --radius-sm: 4px;
  --transition-fast: 150ms ease;
  --transition: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}

/* ============================================ */
/* SHARED THEME: LIGHT                          */
/* ============================================ */
[data-theme="light"] {
  --bg: #faf8f5;
  --bg-secondary: #f5f2ee;
  --text: #2c2c2c;
  --text-secondary: #555550;
  --text-muted: #9c9890;
  --border: #eae6e0;
  --accent: #5a7a9a;
  --accent-soft: rgba(90, 122, 154, 0.08);
  --code-bg: #f4f1ed;
  --code-text: #2c2c2c;
  --code-border: #e8e4de;
  --blockquote-border: rgba(0,0,0,0.12);
  --blockquote-bg: transparent;
  --link: #4a7a6a;
  --toc-text: rgba(0,0,0,0.38);
  --toc-text-hover: rgba(0,0,0,0.7);
  --toc-text-active: rgba(0,0,0,0.88);
  --toc-indicator: rgba(0,0,0,0.5);
}

/* ============================================ */
/* SHARED THEME: DARK                           */
/* ============================================ */
[data-theme="dark"] {
  --bg: #1a1915;
  --bg-secondary: #222018;
  --text: #e8e4df;
  --text-secondary: #b8b4ae;
  --text-muted: #6b6660;
  --border: #33302a;
  --accent: #8ab4d4;
  --accent-soft: rgba(138, 180, 212, 0.08);
  --code-bg: #1f1d18;
  --code-text: #e8e4df;
  --code-border: #33302a;
  --blockquote-border: rgba(255,255,255,0.12);
  --blockquote-bg: transparent;
  --link: #8ac4a8;
  --toc-text: rgba(255,255,255,0.3);
  --toc-text-hover: rgba(255,255,255,0.65);
  --toc-text-active: rgba(255,255,255,0.9);
  --toc-indicator: rgba(255,255,255,0.55);
}

/* ============================================ */
/* SKIN: PAPER (素纸)                            */
/* ============================================ */
[data-skin="paper"] {
  --content-font: var(--font-sans);
  --content-size: 16.5px;
  --content-line-height: 1.85;
  --content-letter-spacing: 0.01em;
  --heading-font: var(--font-serif);
}
[data-skin="paper"][data-theme="light"] {
  --bg: #faf8f5;
  --code-bg: #f4f1ed;
  --code-border: #e8e4de;
}
[data-skin="paper"][data-theme="dark"] {
  --bg: #1a1915;
  --code-bg: #1f1d18;
  --code-border: #33302a;
}
[data-skin="paper"] .md-article h1 { text-align: center; margin-bottom: 32px; }
[data-skin="paper"] .md-article h1,
[data-skin="paper"] .md-article h2,
[data-skin="paper"] .md-article h3 { font-family: var(--font-serif); }

/* ============================================ */
/* SKIN: GRID (方格)                             */
/* ============================================ */
[data-skin="grid"] {
  --content-font: var(--font-sans);
  --content-size: 15px;
  --content-line-height: 1.75;
  --content-letter-spacing: 0;
  --heading-font: var(--font-sans);
  --grid-color: rgba(100, 130, 180, 0.06);
  --grid-size: 24px;
}
[data-skin="grid"][data-theme="light"] {
  --bg: #fafbfc;
  --grid-color: rgba(100, 130, 180, 0.06);
}
[data-skin="grid"][data-theme="dark"] {
  --bg: #0f1117;
  --grid-color: rgba(100, 140, 200, 0.04);
}

/* ============================================ */
/* SKIN: MINIMAL (极简)                          */
/* ============================================ */
[data-skin="minimal"] {
  --content-font: var(--font-sans);
  --content-size: 15.5px;
  --content-line-height: 1.8;
  --content-letter-spacing: 0;
  --heading-font: var(--font-sans);
}
[data-skin="minimal"][data-theme="light"] {
  --bg: #ffffff;
  --text: #374151;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border: #f0f0f0;
  --code-bg: #f9fafb;
  --code-border: #f0f0f0;
  --toc-text: rgba(0,0,0,0.32);
  --toc-text-hover: rgba(0,0,0,0.6);
  --toc-text-active: rgba(0,0,0,0.85);
}
[data-skin="minimal"][data-theme="dark"] {
  --bg: #111111;
  --text: #ececec;
  --text-secondary: #a0a0a0;
  --text-muted: #555555;
  --border: #222222;
  --code-bg: #181818;
  --code-border: #252525;
}

/* ============================================ */
/* TYPOGRAPHY (.md-article)                      */
/* ============================================ */
.md-article h1, .md-article h2, .md-article h3,
.md-article h4, .md-article h5, .md-article h6 {
  font-family: var(--heading-font, var(--font-sans));
  font-weight: 700;
  line-height: 1.35;
  color: var(--text);
  scroll-margin-top: 80px;
}
.md-article h1 {
  font-size: 28px;
  margin-top: 0;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}
.md-article h2 {
  font-size: 22px;
  font-weight: 600;
  margin-top: 48px;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}
.md-article h3 {
  font-size: 18px;
  font-weight: 600;
  margin-top: 36px;
  margin-bottom: 12px;
}
.md-article h4 {
  font-size: 16px;
  font-weight: 600;
  margin-top: 28px;
  margin-bottom: 8px;
}
.md-article h5 { font-size: 15px; font-weight: 600; margin-top: 24px; margin-bottom: 6px; color: var(--text-secondary); }
.md-article h6 { font-size: 14px; font-weight: 600; margin-top: 20px; margin-bottom: 6px; color: var(--text-muted); }

.md-article p {
  margin: 0 0 1.4em;
}
.md-article a { color: var(--link); text-decoration: none; transition: opacity var(--transition-fast); }
.md-article a:hover { opacity: 0.7; text-decoration: underline; }
.md-article strong { font-weight: 600; }
.md-article em { font-style: italic; }
.md-article ul, .md-article ol { margin: 0 0 1.4em; padding-left: 1.5em; }
.md-article li { margin: 0.4em 0; line-height: 1.75; }
.md-article li > ul, .md-article li > ol { margin-bottom: 0; }
.md-article ul li::marker { color: var(--text-muted); }
.md-article ol li::marker { color: var(--text-muted); }

/* Inline code */
.md-article code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  padding: 0.15em 0.4em;
  background: var(--code-bg);
  border-radius: var(--radius-sm);
  color: var(--accent);
}

/* Code blocks */
.md-article pre {
  margin: 1.8em 0;
  padding: 20px 24px;
  background: var(--code-bg);
  border-radius: var(--radius);
  overflow-x: auto;
  border: none;
}
.md-article pre code {
  padding: 0;
  background: none;
  border: none;
  font-size: 13.5px;
  line-height: 1.7;
  color: inherit;
}

/* Blockquote */
.md-article blockquote {
  margin: 1.6em 0;
  padding: 12px 20px;
  border-left: 3px solid var(--blockquote-border);
  background: var(--blockquote-bg);
  color: inherit;
  opacity: 0.8;
  font-style: italic;
}
.md-article blockquote p:last-child { margin-bottom: 0; }

/* Tables */
.md-article table { width: 100%; margin: 1.6em 0; border-collapse: collapse; font-size: 0.9em; }
.md-article th, .md-article td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); }
.md-article th { font-weight: 600; font-size: 0.85em; color: var(--text-secondary); }
.md-article tr:last-child td { border-bottom: none; }

/* HR */
.md-article hr { margin: 3em 0; border: none; height: 0; }

/* Images */
.md-article img { max-width: 100%; height: auto; border-radius: var(--radius); margin: 1.4em 0; }

/* Task lists */
.md-article input[type="checkbox"] { margin-right: 6px; accent-color: var(--accent); transform: scale(1.1); }

/* ============================================ */
/* HIGHLIGHT.JS THEME                            */
/* ============================================ */
.hljs {
  display: block;
  overflow-x: auto;
  padding: 20px 24px;
  background: var(--code-bg);
  color: var(--code-text);
  font-size: 13.5px;
  font-family: var(--font-mono);
  line-height: 1.7;
  border-radius: var(--radius);
  margin: 1.8em 0;
  border: none;
}
.hljs-comment, .hljs-meta { color: #8b949e; font-style: italic; }
[data-theme="light"] .hljs-comment, [data-theme="light"] .hljs-meta { color: #6a737d; }
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section { color: #ff7b72; font-weight: 500; }
[data-theme="light"] .hljs-keyword, [data-theme="light"] .hljs-selector-tag, [data-theme="light"] .hljs-literal, [data-theme="light"] .hljs-section { color: #a626a4; }
.hljs-string, .hljs-title, .hljs-name, .hljs-type, .hljs-attribute, .hljs-symbol, .hljs-bullet, .hljs-addition { color: #a5d6ff; }
[data-theme="light"] .hljs-string, [data-theme="light"] .hljs-title, [data-theme="light"] .hljs-name, [data-theme="light"] .hljs-type, [data-theme="light"] .hljs-attribute, [data-theme="light"] .hljs-symbol, [data-theme="light"] .hljs-bullet, [data-theme="light"] .hljs-addition { color: #50a14f; }
.hljs-deletion { color: #ffa198; }
[data-theme="light"] .hljs-deletion { color: #e45649; }
.hljs-variable, .hljs-template-variable { color: #79c0ff; }
[data-theme="light"] .hljs-variable, [data-theme="light"] .hljs-template-variable { color: #986801; }
.hljs-number, .hljs-regexp, .hljs-built_in, .hljs-params { color: #79c0ff; }
[data-theme="light"] .hljs-number, [data-theme="light"] .hljs-regexp, [data-theme="light"] .hljs-built_in, [data-theme="light"] .hljs-params { color: #0184bc; }
.hljs-function, .hljs-attr { color: #d2a8ff; }
[data-theme="light"] .hljs-function, [data-theme="light"] .hljs-attr { color: #4078f2; }
.hljs-tag, .hljs-selector-id, .hljs-selector-class { color: #7ee787; }
[data-theme="light"] .hljs-tag, [data-theme="light"] .hljs-selector-id, [data-theme="light"] .hljs-selector-class { color: #e45649; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: bold; }
.hljs-link { color: var(--link); text-decoration: underline; }

/* ============================================ */
/* FONT FAMILY OVERRIDE (data-font)             */
/* ============================================ */
[data-font="system"] .md-article { font-family: var(--font-sans); }
[data-font="serif"] .md-article { font-family: var(--font-serif); }
[data-font="mono"] .md-article { font-family: var(--font-mono); font-size: 14.5px; }
`
}
