import { useCallback, useState } from 'react'

/** Tamaño de letra de la app (pequeña / normal / grande). Se aplica antes de pintar (index.html). */
const KEY = 'renivya:text-size'
export const TEXT_SIZES = ['small', 'normal', 'large']

export function applyTextSize(size) {
  const root = document.documentElement
  TEXT_SIZES.forEach((s) => root.classList.toggle(`text-size-${s}`, s === size))
}

export function useTextSize() {
  const [size, setSize] = useState(() => {
    try {
      return localStorage.getItem(KEY) || 'normal'
    } catch {
      return 'normal'
    }
  })
  const change = useCallback((next) => {
    setSize(next)
    applyTextSize(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* sin persistencia */
    }
  }, [])
  return [size, change]
}
