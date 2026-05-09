/**
 * Article Store - chrome.storage.local based article metadata & markdown storage.
 */

export interface ImageRef {
  key: string
  originalUrl: string
  filename: string
}

export interface SavedArticle {
  id: string
  title: string
  url: string
  savedAt: number
  markdown: string
  images: ImageRef[]
  group: string
  excerpt: string
  readTime: number
  favicon?: string
}

const ARTICLES_KEY = 'saved_articles'

/** Get all saved articles */
export async function getAllArticles(): Promise<SavedArticle[]> {
  const result = await chrome.storage.local.get(ARTICLES_KEY)
  return result[ARTICLES_KEY] || []
}

/** Save a new article */
export async function saveArticle(article: SavedArticle): Promise<void> {
  const articles = await getAllArticles()
  articles.unshift(article) // newest first
  await chrome.storage.local.set({ [ARTICLES_KEY]: articles })
}

/** Delete an article by id */
export async function deleteArticle(id: string): Promise<void> {
  const articles = await getAllArticles()
  const filtered = articles.filter(a => a.id !== id)
  await chrome.storage.local.set({ [ARTICLES_KEY]: filtered })
}

/** Update an article (e.g., move to different group) */
export async function updateArticle(id: string, updates: Partial<SavedArticle>): Promise<void> {
  const articles = await getAllArticles()
  const index = articles.findIndex(a => a.id === id)
  if (index >= 0) {
    articles[index] = { ...articles[index], ...updates }
    await chrome.storage.local.set({ [ARTICLES_KEY]: articles })
  }
}

/** Get a single article by id */
export async function getArticle(id: string): Promise<SavedArticle | undefined> {
  const articles = await getAllArticles()
  return articles.find(a => a.id === id)
}

/** Move article to a group */
export async function moveToGroup(articleId: string, group: string): Promise<void> {
  await updateArticle(articleId, { group })
}

/** Generate a simple nanoid-like ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** Estimate read time in minutes */
export function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length
  const cjkChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  // CJK: ~300 chars/min, Latin: ~200 words/min
  const minutes = cjkChars / 300 + (words - cjkChars) / 200
  return Math.max(1, Math.round(minutes))
}
