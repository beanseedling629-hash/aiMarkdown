const THEME_KEY = 'md-viewer-theme'
const SKIN_KEY = 'md-viewer-skin'
const SETTINGS_KEY = 'md-viewer-settings'

export type Theme = 'light' | 'dark'
export type Skin = 'paper' | 'grid' | 'minimal'
export type FontFamily = 'system' | 'serif' | 'mono'

export interface Settings {
  zoom: number         // 0.8 ~ 1.4, default 1.0
  tocDepth: number     // 1 ~ 6, default 2
  fontFamily: FontFamily
}

const DEFAULT_SETTINGS: Settings = {
  zoom: 1.0,
  tocDepth: 2,
  fontFamily: 'system',
}

export function initTheme(): void {
  const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null
  const storedSkin = localStorage.getItem(SKIN_KEY) as Skin | null
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = storedTheme || (prefersDark ? 'dark' : 'light')
  const skin = storedSkin || 'paper'
  applyTheme(theme)
  applySkin(skin)
  applySettings(getSettings())
}

export function toggleTheme(): void {
  const current = getCurrentTheme()
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  applyTheme(next)
}

export function cycleSkin(): Skin {
  const skins: Skin[] = ['paper', 'grid', 'minimal']
  const current = getCurrentSkin()
  const idx = skins.indexOf(current)
  const next = skins[(idx + 1) % skins.length]
  applySkin(next)
  return next
}

export function getCurrentTheme(): Theme {
  return (document.documentElement.getAttribute('data-theme') as Theme) || 'light'
}

export function getCurrentSkin(): Skin {
  return (document.documentElement.getAttribute('data-skin') as Skin) || 'paper'
}

export function getSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (_) { /* fallback */ }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  applySettings(settings)
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
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
}

function applySkin(skin: Skin): void {
  document.documentElement.setAttribute('data-skin', skin)
  localStorage.setItem(SKIN_KEY, skin)
}
