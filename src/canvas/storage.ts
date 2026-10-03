import type { CanvasDocument } from './types'

const storageKey = 'medfolio.canvas.last'

export function saveCanvas(document: CanvasDocument): CanvasDocument {
  const saved = { ...document, savedAt: new Date().toISOString() }
  localStorage.setItem(storageKey, JSON.stringify(saved))
  return saved
}

export function loadCanvas(): CanvasDocument | null {
  try {
    const value = localStorage.getItem(storageKey)
    return value ? JSON.parse(value) as CanvasDocument : null
  } catch { return null }
}

export function clearCanvas() { localStorage.removeItem(storageKey) }