import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import 'moment/dist/locale/es'
import 'moment/dist/locale/fr'
import 'moment/dist/locale/pt'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { DEFAULT_LOCALE, UI_LOCALES, detectBrowserLocale, isUiLocale } from '@/lib/languages'

const STORAGE_KEY = 'renivya:locale'
const I18nContext = createContext(null)

function readInitialLocale() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && isUiLocale(stored)) return stored
  } catch {
    /* sin almacenamiento */
  }
  return detectBrowserLocale()
}

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => (vars[key] != null ? String(vars[key]) : match))
}

/** Traducción pura (sin React) para usar en servicios. Respaldo: locale → es → clave. */
export function translate(locale, key, vars) {
  const value = dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE]?.[key]
  return value == null ? key : interpolate(value, vars)
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale)

  useEffect(() => {
    const meta = UI_LOCALES.find((l) => l.code === locale)
    moment.locale(meta?.momentLocale ?? 'en')
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next) => {
    if (!isUiLocale(next)) return
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* sin persistencia */
    }
  }, [])

  const t = useCallback((key, vars) => translate(locale, key, vars), [locale])

  const value = useMemo(() => ({ locale, setLocale, t, locales: UI_LOCALES }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>')
  return ctx
}
