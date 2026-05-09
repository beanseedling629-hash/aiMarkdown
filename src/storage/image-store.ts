/**
 * Image Store - IndexedDB based blob storage for article images.
 * Stores downloaded images as Blobs to prevent 404 issues.
 */

const DB_NAME = 'ai-markdown-images'
const DB_VERSION = 1
const STORE_NAME = 'images'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export interface StoredImage {
  key: string
  blob: Blob
  mimeType: string
  articleId: string
}

/** Save an image blob to IndexedDB */
export async function saveImage(image: StoredImage): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(image)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get an image blob by key */
export async function getImage(key: string): Promise<StoredImage | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Delete all images belonging to an article */
export async function deleteArticleImages(articleId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        if ((cursor.value as StoredImage).articleId === articleId) {
          cursor.delete()
        }
        cursor.continue()
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get all image keys for an article */
export async function getArticleImageKeys(articleId: string): Promise<string[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.openCursor()
    const keys: string[] = []
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        if ((cursor.value as StoredImage).articleId === articleId) {
          keys.push(cursor.value.key)
        }
        cursor.continue()
      } else {
        resolve(keys)
      }
    }
    request.onerror = () => reject(request.error)
  })
}
