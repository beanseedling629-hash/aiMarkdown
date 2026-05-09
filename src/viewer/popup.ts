// Reading Mode button
const readingModeBtn = document.getElementById('btn-reading-mode')
if (readingModeBtn) {
  readingModeBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id && tab.url && /^https?:\/\//.test(tab.url)) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-reader.js'],
        })
      } else {
        alert('阅读模式仅支持 http/https 页面')
      }
    } catch (e) {
      console.error('Failed to inject reading mode:', e)
    }
    window.close()
  })
}

// Library button
const libraryBtn = document.getElementById('btn-library')
if (libraryBtn) {
  libraryBtn.addEventListener('click', async () => {
    const url = chrome.runtime.getURL('library.html')
    await chrome.tabs.create({ url })
    window.close()
  })
}

// Open Markdown folder viewer
const folderBtn = document.getElementById('btn-folder')
if (folderBtn) {
  folderBtn.addEventListener('click', async () => {
    try {
      const viewerUrl = chrome.runtime.getURL('viewer.html')
      await chrome.tabs.create({ url: viewerUrl })
      window.close()
    } catch (e) {
      window.open(chrome.runtime.getURL('viewer.html'), '_blank')
    }
  })
}
