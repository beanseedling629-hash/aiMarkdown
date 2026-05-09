/**
 * Shared layout styles for the MD viewer layout.
 * Used by: content/index.ts (local .md), reader-ui.ts (reading mode), library.ts (saved articles).
 *
 * Provides: variables, themes, skins, body layout, TOC sidebar, FAB, scrollbars, responsive.
 * Does NOT include article typography (that comes from article-styles.ts).
 */
import { getArticleStyles } from './article-styles'

export function getFullStyles(): string {
  return getLayoutStyles() + getArticleStyles()
}

export function getLayoutStyles(): string {
  return /* css */`
/* ============================================ */
/* BASE VARIABLES                                */
/* ============================================ */
:root, :host {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  --font-serif: Charter, 'Bitstream Charter', 'Noto Serif SC', 'Source Han Serif SC', 'STSongti-SC', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace;
  --content-max-width: 820px;
  --content-spacing: 1.8em;
  --toc-width: 220px;
  --radius: 8px;
  --radius-sm: 4px;
  --transition-fast: 150ms ease;
  --transition: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}

/* ============================================ */
/* THEME: LIGHT                                  */
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
  --fab-bg: rgba(255,255,255,0.72);
  --fab-border: rgba(0,0,0,0.06);
}

/* ============================================ */
/* THEME: DARK                                   */
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
  --fab-bg: rgba(26,25,21,0.75);
  --fab-border: rgba(255,255,255,0.08);
}

/* ============================================ */
/* SKIN: PAPER                                   */
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
[data-skin="paper"][data-theme="light"] .md-sidebar {
  background: rgba(255, 252, 248, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.03);
}
[data-skin="paper"][data-theme="dark"] .md-sidebar {
  background: rgba(26, 25, 21, 0.7);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 8px;
}

/* ============================================ */
/* SKIN: GRID                                    */
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
  --toc-card-bg: rgba(255, 255, 255, 0.82);
  --toc-card-border: rgba(0, 0, 0, 0.06);
  --toc-card-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0.5px 1px rgba(0,0,0,0.03);
}
[data-skin="grid"][data-theme="dark"] {
  --bg: #0f1117;
  --grid-color: rgba(100, 140, 200, 0.04);
  --toc-card-bg: rgba(18, 20, 28, 0.85);
  --toc-card-border: rgba(255, 255, 255, 0.06);
  --toc-card-shadow: 0 2px 12px rgba(0,0,0,0.2);
}
[data-skin="grid"] .md-viewer {
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: var(--grid-size) var(--grid-size);
}
[data-skin="grid"] .md-sidebar {
  background: var(--toc-card-bg);
  border: 1px solid var(--toc-card-border);
  border-radius: 10px;
  padding: 16px 12px;
  box-shadow: var(--toc-card-shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* ============================================ */
/* SKIN: MINIMAL                                 */
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
/* LAYOUT                                        */
/* ============================================ */
.md-viewer {
  min-height: 100vh;
  position: relative;
  font-family: var(--content-font, var(--font-sans));
  font-size: var(--content-size, 16px);
  line-height: var(--content-line-height, 1.8);
  letter-spacing: var(--content-letter-spacing, 0);
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}

.md-body { display: flex; min-height: 100vh; }
.md-main {
  flex: 1;
  min-width: 0;
  padding: 60px 48px 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.md-article {
  width: 100%;
  max-width: var(--content-max-width);
}

/* ============================================ */
/* SIDEBAR / TOC                                 */
/* ============================================ */
.md-sidebar {
  position: fixed;
  top: 60px;
  right: 32px;
  width: var(--toc-width);
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 8px;
}
.md-toc ul { list-style: none; padding: 0; margin: 0; }
.md-toc li { position: relative; }
.md-toc .toc-item.toc-hidden { display: none; }
.md-toc .toc-row {
  display: flex;
  align-items: center;
  gap: 2px;
}
.md-toc .toc-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--toc-text);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.md-toc .toc-toggle:hover { background: var(--accent-soft); color: var(--toc-text-active); }
.md-toc .toc-toggle svg { width: 10px; height: 10px; transition: transform var(--transition-fast); }
.md-toc .toc-toggle.expanded svg { transform: rotate(90deg); }
.md-toc .toc-toggle-placeholder { width: 22px; flex-shrink: 0; }
.md-toc a {
  display: block;
  flex: 1;
  padding: 5px 0 5px 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 2;
  color: var(--toc-text);
  text-decoration: none;
  transition: color var(--transition-fast);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}
.md-toc a:hover { color: var(--toc-text-hover); }
.md-toc a.active {
  color: var(--toc-text-active);
  font-weight: 500;
}
.md-toc a.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 14px;
  background: var(--toc-indicator);
  border-radius: 1px;
}

/* TOC indentation */
.md-toc .toc-level-1 a { font-size: 13px; font-weight: 500; }
.md-toc .toc-level-2 .toc-row { padding-left: 14px; }
.md-toc .toc-level-3 .toc-row { padding-left: 28px; }
.md-toc .toc-level-4 .toc-row { padding-left: 42px; }
.md-toc .toc-level-5 .toc-row { padding-left: 56px; }
.md-toc .toc-level-6 .toc-row { padding-left: 70px; }

/* ============================================ */
/* SCROLLBAR                                     */
/* ============================================ */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
.md-sidebar::-webkit-scrollbar { width: 3px; }
.md-sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* ============================================ */
/* RESPONSIVE                                    */
/* ============================================ */
@media (max-width: 1200px) {
  .md-sidebar { right: 16px; width: 180px; }
  .md-main { padding-right: 220px; }
}
@media (max-width: 900px) {
  .md-sidebar { display: none; }
  .md-main { padding: 40px 24px 80px; }
}
`
}
