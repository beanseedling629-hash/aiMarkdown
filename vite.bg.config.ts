import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'chrome110',
    lib: {
      entry: resolve(__dirname, 'src/background/index.ts'),
      name: 'MarkdownViewerBG',
      formats: ['iife'],
      fileName: () => 'background.js',
    },
  },
})
