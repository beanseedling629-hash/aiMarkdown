import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear dist (pages already built)
    target: 'chrome110',
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'MarkdownViewer',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
