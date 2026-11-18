import { useCallback, useEffect, useState } from 'react'

/**
 * Soporte de app web instalable (PWA).
 * - iOS/iPadOS (Safari): no hay evento de instalación → instrucciones "Compartir → Añadir a pantalla de inicio".
 * - Android/Chrome/Edge: se captura `beforeinstallprompt` y se ofrece un botón "Instalar".
 */

const DISMISS_KEY = 'renivya:install-dismissed'

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function isIos() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iPhone|iPad|iPod/.test(ua) || iPadOs
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      /* sin service worker: la app funciona igual, solo sin modo offline */
    })
  })
}

let deferredPrompt = null
const listeners = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((fn) => fn())
  })
}

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function usePwaInstall() {
  const [, force] = useState(0)
  const [dismissed, setDismissed] = useState(readDismissed)
  const standalone = isStandalone()
  const ios = isIos()

  useEffect(() => {
    const fn = () => force((n) => n + 1)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice.catch(() => null)
    deferredPrompt = null
    force((n) => n + 1)
    return choice?.outcome === 'accepted'
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* sin persistencia */
    }
  }, [])

  return {
    standalone,
    ios,
    canPrompt: Boolean(deferredPrompt),
    /** Hay algo que ofrecer: instrucciones (iOS) o botón nativo (Chromium). */
    available: !standalone && (ios || Boolean(deferredPrompt)),
    dismissed,
    dismiss,
    promptInstall,
  }
}
