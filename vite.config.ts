import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome110',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/viewer/popup.html'),
        viewer: resolve(__dirname, 'src/viewer/index.html'),
        library: resolve(__dirname, 'src/library/library.html'),
        'reader-page': resolve(__dirname, 'src/reader-page/reader-page.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
