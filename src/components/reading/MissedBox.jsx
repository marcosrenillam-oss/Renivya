import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { formatRelativeTime } from '@/lib/format'
import { byFront } from '@/lib/news/useNews'

/**
 * Última visita: se lee una vez al abrir la app (la de la sesión anterior) y se actualiza al
 * salir. Así "Lo que te has perdido" cuenta lo publicado desde entonces.
 */
const KEY = 'renivya:last-visit'
const MIN_GAP_MS = 4 * 3_600_000
let previous = null
try {
  previous = localStorage.getItem(KEY)
  if (!previous) localStorage.setItem(KEY, new Date().toISOString())
} catch {
  /* sin almacenamiento */
}
const touch = () => {
  try {
    localStorage.setItem(KEY, new Date().toISOString())
  } catch {
    /* sin almacenamiento */
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && touch())
  window.addEventListener('pagehide', touch)
}

/** "Lo que te has perdido": al volver tras unas horas, lo publicado desde la última visita. */
export default function MissedBox({ stories }) {
  const { t, locale } = useI18n()
  const [since, setSince] = useState(() => (previous && Date.now() - Date.parse(previous) > MIN_GAP_MS ? previous : null))
  const missed = useMemo(
    () => (since ? stories.filter((s) => (s.published_at || s.updated_date || '') > since).sort(byFront) : []),
    [stories, since]
  )
  if (!since || missed.length < 3) return null
  const breaking = missed.filter((s) => s.is_breaking).length
  const close = () => {
    previous = null
    setSince(null)
  }
  return (
    <section className="safe-x">
      <div className="border-y-[3px] border-double border-foreground py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-black leading-tight">{t('read.missedTitle')}</h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {t('read.missedSince', { time: formatRelativeTime(since, locale) })} · {t('read.missedCount', { count: missed.length })}
              {breaking > 0 && <span className="font-semibold text-destructive"> · {t('world.cardBreaking', { count: breaking })}</span>}
            </p>
          </div>
          <button type="button" onClick={close} aria-label={t('common.close')} className="-mr-1 p-1 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ol className="mt-2 space-y-1.5 border-t border-foreground/30 pt-2">
          {missed.slice(0, 4).map((s, i) => (
            <li key={s.id} className="flex gap-2.5">
              <span className="font-display text-[18px] font-black leading-snug text-foreground/40">{i + 1}</span>
              <Link to={`/story/${s.id}`} onClick={close} className="font-display text-[16.5px] font-bold leading-snug">
                {s.is_breaking && <span className="mr-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-destructive">{t('story.breaking')}</span>}
                {s.title}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
