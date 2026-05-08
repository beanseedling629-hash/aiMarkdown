// Background service worker for Markdown Viewer
// Keep alive by registering event listeners at top level

// Listen for install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Markdown Viewer] Extension installed')
})

// Handle image proxy requests from content scripts
chrome.runtime.onMessage.addListener(
  (message: { type: string; url: string }, _sender, sendResponse) => {
    if (message.type === 'FETCH_LOCAL_IMAGE') {
      fetchLocalImage(message.url).then(sendResponse)
      return true // keep channel open for async response
    }
    return false
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
