/**
 * Post-build: Copy manifest.json, icons, and fix HTML paths
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'

const distDir = 'dist'

// 1. Generate manifest.json for dist
// NOTE: No content_scripts for file:// — we use programmatic injection
// from the background service worker (same approach as Markdown Viewer 5.3)
const manifest = {
  manifest_version: 3,
  name: "AI Markdown Viewer",
  version: "1.1.0",
  description: "Markdown viewer + Web page reading mode with save to Markdown",
  permissions: ["activeTab", "tabs", "scripting", "downloads", "storage", "unlimitedStorage"],
  host_permissions: ["http://*/*", "https://*/*", "file:///*"],
  icons: {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*"],
      js: ["content-hotkey.js"],
      run_at: "document_end"
    }
  ],
  background: {
    service_worker: "background.js"
  },
  action: {
    default_popup: "popup.html",
    default_icon: {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png"
    }
  },
  commands: {
    "toggle-reading-mode": {
      suggested_key: {
        default: "Ctrl+Shift+R",
        mac: "Command+Shift+R"
      },
      description: "Toggle reading mode on current page"
    }
  }
}

writeFileSync(join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

// 2. Copy icons
const iconsDir = join(distDir, 'icons')
if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })
for (const size of ['16', '48', '128']) {
  const src = `public/icon-${size}.png`
  if (existsSync(src)) {
    copyFileSync(src, join(iconsDir, `icon-${size}.png`))
  }
}

// 3. Fix HTML files - move them to dist root and fix paths
function findAndFixHtml(name, subPaths) {
  // Check sub-paths first (Vite outputs there), then dist root
  const possiblePaths = [
    ...subPaths.map(p => join(distDir, p)),
    join(distDir, name + '.html'),
  ]
  
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      let content = readFileSync(p, 'utf-8')
      content = content.replace(/(src|href)="\/assets\//g, '$1="assets/')
      content = content.replace(/(src|href)="\/([^"]+)"/g, '$1="$2"')
      const outPath = join(distDir, name + '.html')
      writeFileSync(outPath, content)
      if (p !== outPath) console.log(`  Fixed: ${p} → ${outPath}`)
      else console.log(`  Fixed paths in: ${outPath}`)
      return
    }
  }
}

findAndFixHtml('popup', ['src/viewer/popup.html'])
findAndFixHtml('viewer', ['src/viewer/index.html'])
findAndFixHtml('library', ['src/library/library.html'])
findAndFixHtml('reader-page', ['src/reader-page/reader-page.html'])

console.log('✅ Build post-processing complete')
