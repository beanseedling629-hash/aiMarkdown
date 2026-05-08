const btn = document.getElementById('open-folder')

if (btn) {
  btn.addEventListener('click', async () => {
    try {
      const viewerUrl = chrome.runtime.getURL('src/viewer/index.html')
      await chrome.tabs.create({ url: viewerUrl })
      // Close popup after opening
      window.close()
    } catch (e) {
      // Fallback: open in new window
      window.open(chrome.runtime.getURL('src/viewer/index.html'), '_blank')
    }
  })
}
