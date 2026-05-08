/**
 * Post-build: Copy manifest.json, icons, and fix HTML paths
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'

const distDir = 'dist'

// 1. Copy manifest.json to dist
const manifest = {
  manifest_version: 3,
  name: "Markdown Viewer",
  version: "1.0.0",
  description: "Beautiful Markdown file viewer with TOC, dark mode, and folder browsing",
  permissions: ["activeTab", "tabs"],
  icons: {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  content_scripts: [
    {
      matches: ["file:///*"],
      include_globs: ["*.md", "*.markdown", "*.mdown", "*.mkdn", "*.mkd"],
      js: ["content.js"],
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
const popupSrc = join(distDir, 'popup.html') 
const viewerSrc = join(distDir, 'viewer.html')

// Fix popup.html if it exists in a subdirectory
function findAndFixHtml(name) {
  // Vite with HTML input puts them based on their input path
  const possiblePaths = [
    join(distDir, name + '.html'),
    join(distDir, 'src', 'viewer', name === 'popup' ? 'popup.html' : 'index.html'),
  ]
  
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      let content = readFileSync(p, 'utf-8')
      // Fix absolute paths to relative
      content = content.replace(/(src|href)="\/assets\//g, '$1="assets/')
      content = content.replace(/(src|href)="\/([^"]+)"/g, '$1="$2"')
      // Write to dist root
      const outPath = join(distDir, name + '.html')
      writeFileSync(outPath, content)
      console.log(`  Fixed: ${p} → ${outPath}`)
      return
    }
  }
}

findAndFixHtml('popup')
findAndFixHtml('viewer')

// 4. Remove extra directories
console.log('✅ Build post-processing complete')
