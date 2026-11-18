import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, RefreshCw } from 'lucide-react'
import { getSnapshotMeta, syncSnapshot } from '@/lib/snapshotSync'
import { listSavedStoryLinks } from '@/lib/dataService'
import { pushSupport } from '@/lib/pushSetup'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

/* global __BUILD_TIME__ */
const BUILD = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null
const STALE_MIN = 45

function Row({ label, value, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-[14px] text-foreground/80">{label}</dt>
      <dd className={cn('text-right font-serif-text text-[15px] tabular-nums', tone === 'bad' && 'font-semibold text-destructive')}>{value}</dd>
    </div>
  )
}

function Block({ title, children }) {
  return (
    <section>
      <div className="rule-thick" />
      <h2 className="py-1.5 text-[12px] font-bold uppercase tracking-[0.18em]">{title}</h2>
      <dl className="divide-y divide-foreground/20 border-t border-foreground">{children}</dl>
    </section>
  )
}

const mb = (n) => (n / 1048576).toFixed(n > 10 * 1048576 ? 0 : 1)

/** Estado del sistema: si las noticias están al día, qué fuentes fallan y cómo está este dispositivo. */
export default function Status() {
  const { t, locale } = useI18n()
  const qc = useQueryClient()
  const [meta, setMeta] = useState(getSnapshotMeta)
  const [busy, setBusy] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [storage, setStorage] = useState(null)
  const [allSources, setAllSources] = useState(false)
  const saved = useQuery({ queryKey: ['status-saved'], queryFn: listSavedStoryLinks })

  useEffect(() => {
    const on = () => setOnline(navigator.onLine)
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    navigator.storage?.estimate?.().then(setStorage).catch(() => {})
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', on)
    }
  }, [])

  const refresh = async () => {
    haptic()
    setBusy(true)
    try {
      const { updated, meta: next } = await syncSnapshot()
      if (updated) await qc.invalidateQueries()
      setMeta(next || getSnapshotMeta())
    } catch {
      /* sin red */
    } finally {
      setBusy(false)
    }
  }

  const sources = meta?.sources || []
  const failing = sources.filter((s) => !s.ok)
  const ageMin = meta?.generated_at ? (Date.now() - Date.parse(meta.generated_at)) / 60000 : Infinity
  const stale = ageMin > STALE_MIN
  const feedsBad = sources.length > 0 && failing.length / sources.length > 0.2
  const ok = !stale && !feedsBad && meta?.mode === 'real'
  const h = meta?.health
  const push = pushSupport()
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  const next = meta?.generated_at ? new Date(Date.parse(meta.generated_at) + 15 * 60000) : null

  return (
    <div className="space-y-7">
      <header className="pt-1">
        <div className="rule-thick" />
        <h1 className="py-1 font-display text-[34px] font-black leading-[1.05]">{t('status.title')}</h1>
        <p className="border-t border-foreground pt-1.5 font-serif-text text-[15px] italic text-muted-foreground">{t('status.subtitle')}</p>
      </header>

      <div className={cn('flex items-center gap-3 border-y-[3px] border-double py-3', ok ? 'border-foreground' : 'border-destructive')}>
        <span className={cn('h-3 w-3 shrink-0 rounded-full', ok ? 'bg-foreground' : 'bg-destructive')} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[21px] font-bold leading-tight">
            {meta?.mode !== 'real' ? t('status.demo') : stale ? t('status.stale') : feedsBad ? t('status.feedsBad') : t('status.ok')}
          </p>
          {meta?.generated_at && <p className="text-[12.5px] text-muted-foreground">{t('status.lastNews', { time: formatRelativeTime(meta.generated_at, locale) })}</p>}
        </div>
        <button type="button" onClick={refresh} disabled={busy || !online} className="flex shrink-0 items-center gap-1.5 border border-foreground px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] disabled:opacity-40">
          <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
          {t('status.refresh')}
        </button>
      </div>

      <Block title={t('status.news')}>
        <Row label={t('status.published')} value={meta?.generated_at ? formatDateTime(meta.generated_at, locale) : '—'} tone={stale ? 'bad' : undefined} />
        <Row label={t('status.next')} value={next ? (next > new Date() ? formatRelativeTime(next, locale) : t('status.anyMoment')) : '—'} />
        <Row label={t('status.onDevice')} value={meta?.applied_at ? formatRelativeTime(meta.applied_at, locale) : '—'} />
        <Row label={t('status.stories')} value={meta?.counts?.Story ?? '—'} />
      </Block>

      <Block title={t('status.sources')}>
        <Row label={t('status.sourcesOk')} value={sources.length ? `${sources.length - failing.length} / ${sources.length}` : '—'} tone={feedsBad ? 'bad' : undefined} />
        {failing.map((s) => (
          <Row key={s.name} label={s.name} value={s.error || t('status.failed')} tone="bad" />
        ))}
        {sources.length > 0 && (
          <div className="py-1">
            <button type="button" onClick={() => setAllSources((v) => !v)} className="flex items-center gap-1 py-1.5 text-[12px] italic text-muted-foreground">
              <ChevronDown className={cn('h-3.5 w-3.5 transition', allSources && 'rotate-180')} />
              {allSources ? t('status.hideSources') : t('status.showSources')}
            </button>
            {allSources && (
              <ul className="columns-2 gap-4 pb-2 text-[13px]">
                {[...sources].sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                  <li key={s.name} className={cn('break-inside-avoid py-0.5', !s.ok && 'text-destructive')}>
                    {s.ok ? '●' : '○'} {s.name}
                    <span className="text-muted-foreground"> · {s.skipped ? t('status.recent') : s.ok ? s.items : t('status.failed')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Block>

      {h && (
        <Block title={t('status.lastRun')}>
          <Row label={t('status.newArticles')} value={h.new_articles} />
          <Row label={t('status.storiesNew')} value={`${h.stories_created} · ${t('status.updatedN', { count: h.stories_updated })}`} />
          <Row label={t('status.fullTexts')} value={`${h.full_texts} / ${h.pages_checked}`} />
          <Row label={t('status.withPhoto')} value={h.stories_total ? `${Math.round((100 * h.stories_with_photo) / h.stories_total)} %` : '—'} />
        </Block>
      )}

      <Block title={t('status.device')}>
        <Row label={t('status.connection')} value={online ? t('status.online') : t('status.offline')} tone={online ? undefined : 'bad'} />
        <Row label={t('status.storage')} value={storage ? `${mb(storage.usage || 0)} MB` : '—'} />
        <Row label={t('status.saved')} value={saved.data?.length ?? '—'} />
        <Row label={t('status.installed')} value={standalone ? t('status.yes') : t('status.no')} />
        <Row label={t('status.alerts')} value={push.permission === 'granted' ? t('status.on') : push.permission === 'denied' ? t('status.blocked') : t('status.off')} />
        <Row label={t('status.version')} value={BUILD ? formatDateTime(BUILD, locale) : '—'} />
      </Block>
    </div>
  )
}
