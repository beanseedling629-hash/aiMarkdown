// Background service worker for Markdown Viewer + Reading Mode

// Listen for install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Markdown Viewer] Extension installed')
})

// ===== Dynamic injection for file:// .md files =====
// Static content_scripts in manifest doesn't reliably inject on file:// in MV3.
// Instead, we detect when a .md file is opened and programmatically inject.
const MD_EXTENSIONS = /\.(md|markdown|mdown|mkdn|mkd)([?#].*)?$/i

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('file://')) {
    const decodedUrl = decodeURIComponent(tab.url)
    if (MD_EXTENSIONS.test(decodedUrl)) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      }).catch(err => {
        console.log('[MD Viewer] Injection failed:', err)
      })
    }
  }
})

// ===== Keyboard shortcut: toggle reading mode (Ctrl+Shift+R) =====
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-reading-mode') {
    injectReadingMode()
  }
})

async function injectReadingMode() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab || !tab.id || !tab.url) return
    if (!/^https?:\/\//.test(tab.url)) return
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-reader.js'],
    })
  } catch (e) {
    console.error('[Reader] Injection failed:', e)
  }
}

async function injectReadingModeForTab(tabId: number | undefined) {
  if (!tabId) return
  try {
    const tab = await chrome.tabs.get(tabId)
    if (!tab.url || !/^https?:\/\//.test(tab.url)) return
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-reader.js'],
    })
  } catch (e) {
    console.error('[Reader] Injection failed:', e)
  }
}

// ===== Message handling =====
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; url?: string; data?: string; filename?: string },
    sender,
    sendResponse
  ) => {
    switch (message.type) {
      case 'TOGGLE_READING_MODE':
        injectReadingModeForTab(sender.tab?.id)
        sendResponse({ ok: true })
        return false

      case 'OPEN_READER_PAGE':
        chrome.tabs.create({ url: chrome.runtime.getURL(message.url!) })
        sendResponse({ ok: true })
        return false

      case 'FETCH_LOCAL_IMAGE':
        fetchLocalImage(message.url!).then(sendResponse)
        return true

      case 'READ_FILE':
        readFileContent(message.url!).then(sendResponse)
        return true

      case 'DOWNLOAD_ZIP':
        handleDownloadZip(message.data!, message.filename!)
          .then(sendResponse)
        return true

      default:
        return false
    }
  }
)

async function fetchLocalImage(
  url: string
): Promise<{ blobUrl?: string; error?: string }> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const reader = new FileReader()
    return new Promise((resolve) => {
      reader.onloadend = () => {
        resolve({ blobUrl: reader.result as string })
      }
      reader.readAsDataURL(blob)
    })
  } catch (e: any) {
    return { error: e.message }
  }
}

async function handleDownloadZip(
  dataUrl: string,
  filename: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    await chrome.downloads.download({ url, filename, saveAs: true })
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

/**
 * Read a file:// URL and return its raw text content.
 * Service worker can fetch file:// when extension has file access enabled.
 */
async function readFileContent(
  fileUrl: string
): Promise<{ content?: string; error?: string }> {
  try {
    const response = await fetch(fileUrl)
    const text = await response.text()
    return { content: text }
  } catch (e: any) {
    return { error: e.message }
  }
}
