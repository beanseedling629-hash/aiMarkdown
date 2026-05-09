import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'chrome110',
    lib: {
      entry: resolve(__dirname, 'src/content/hotkey.ts'),
      name: 'HotkeyListener',
      formats: ['iife'],
      fileName: () => 'content-hotkey.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
