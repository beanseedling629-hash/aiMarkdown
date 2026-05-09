const THEME_KEY = 'md-viewer-theme'
const SKIN_KEY = 'md-viewer-skin'
const SETTINGS_KEY = 'md-viewer-settings'

export type Theme = 'light' | 'dark'
export type Skin = 'paper' | 'grid' | 'minimal'
export type FontFamily = 'system' | 'serif' | 'mono'
export type Layout = 'compact' | 'standard' | 'comfortable' | 'wide'

export interface Settings {
  zoom: number
  tocDepth: number
  fontFamily: FontFamily
  layout: Layout
}

const DEFAULT_SETTINGS: Settings = {
  zoom: 1.0,
  tocDepth: 2,
  fontFamily: 'system',
  layout: 'comfortable',
}

// In-memory cache (loaded from chrome.storage on init)
let cachedTheme: Theme = 'light'
let cachedSkin: Skin = 'paper'
let cachedSettings: Settings = { ...DEFAULT_SETTINGS }

/**
 * Initialize theme from chrome.storage.local (async).
 * Falls back to defaults if storage is unavailable.
 */
export async function initTheme(): Promise<void> {
  // Load from chrome.storage if available
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const result = await chrome.storage.local.get([THEME_KEY, SKIN_KEY, SETTINGS_KEY])
      if (result[THEME_KEY]) cachedTheme = result[THEME_KEY]
      if (result[SKIN_KEY]) cachedSkin = result[SKIN_KEY]
      if (result[SETTINGS_KEY]) cachedSettings = { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] }
    } catch {
      // Fallback to localStorage for contexts without chrome.storage
      loadFromLocalStorage()
    }
  } else {
    loadFromLocalStorage()
  }

  // Auto-detect dark mode if no stored preference
  if (!cachedTheme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    cachedTheme = prefersDark ? 'dark' : 'light'
  }

  applyThemeToDOM(cachedTheme)
  applySkinToDOM(cachedSkin)
  applySettings(cachedSettings)
}

function loadFromLocalStorage() {
  const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null
  const storedSkin = localStorage.getItem(SKIN_KEY) as Skin | null
  if (storedTheme) cachedTheme = storedTheme
  if (storedSkin) cachedSkin = storedSkin
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch { /* ignore */ }
}

export function toggleTheme(): void {
  const next: Theme = cachedTheme === 'dark' ? 'light' : 'dark'
  cachedTheme = next
  applyThemeToDOM(next)
  persistSetting(THEME_KEY, next)
}

export function cycleSkin(): Skin {
  const skins: Skin[] = ['paper', 'grid', 'minimal']
  const idx = skins.indexOf(cachedSkin)
  const next = skins[(idx + 1) % skins.length]
  cachedSkin = next
  applySkinToDOM(next)
  persistSetting(SKIN_KEY, next)
  return next
}

export function getCurrentTheme(): Theme {
  return cachedTheme
}

export function getCurrentSkin(): Skin {
  return cachedSkin
}

export function getSettings(): Settings {
  return { ...cachedSettings }
}

export function saveSettings(settings: Settings): void {
  cachedSettings = { ...settings }
  applySettings(settings)
  persistSetting(SETTINGS_KEY, settings)
}

export function applySettings(settings: Settings): void {
  const root = document.documentElement

  // Zoom
  root.style.setProperty('--zoom', String(settings.zoom))
  const article = document.querySelector('.md-article') as HTMLElement | null
  if (article) {
    article.style.fontSize = `calc(var(--content-size, 16px) * ${settings.zoom})`
  }

  // Font family
  root.setAttribute('data-font', settings.fontFamily)

  // Layout preset
  const layoutPresets: Record<Layout, { maxWidth: string; lineHeight: string; fontSize: string; spacing: string }> = {
    compact:     { maxWidth: '620px', lineHeight: '1.6',  fontSize: '15px',   spacing: '1.2em' },
    standard:    { maxWidth: '720px', lineHeight: '1.75', fontSize: '16px',   spacing: '1.5em' },
    comfortable: { maxWidth: '820px', lineHeight: '1.85', fontSize: '16.5px', spacing: '1.8em' },
    wide:        { maxWidth: '960px', lineHeight: '2.0',  fontSize: '17px',   spacing: '2.2em' },
  }
  const preset = layoutPresets[settings.layout] || layoutPresets.comfortable
  root.style.setProperty('--content-max-width', preset.maxWidth)
  root.style.setProperty('--content-line-height', preset.lineHeight)
  root.style.setProperty('--content-size', preset.fontSize)
  root.style.setProperty('--content-spacing', preset.spacing)
}

function applyThemeToDOM(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

function applySkinToDOM(skin: Skin): void {
  document.documentElement.setAttribute('data-skin', skin)
}

/** Persist to chrome.storage.local (and localStorage as fallback) */
function persistSetting(key: string, value: any): void {
  // Always write to localStorage as fast fallback
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))

  // Write to chrome.storage for cross-context sync
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ [key]: value }).catch(() => {})
  }
}
