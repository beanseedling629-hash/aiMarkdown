/// <reference types="vite/client" />
/// <reference types="chrome" />

declare module 'markdown-it-anchor' {
  import MarkdownIt from 'markdown-it'
  const anchor: MarkdownIt.PluginWithOptions
  export default anchor
}
