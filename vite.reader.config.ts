import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'chrome110',
    lib: {
      entry: resolve(__dirname, 'src/content/reader.ts'),
      name: 'AiMarkdownReader',
      formats: ['iife'],
      fileName: () => 'content-reader.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
