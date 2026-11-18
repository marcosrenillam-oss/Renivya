import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

// Qué cambió, contado en palabras (a partir de los campos que cambiaron en cada versión).
const FIELD_KEYS = {
  title: 'evo.title',
  summary: 'evo.text',
  body: 'evo.text',
  key_points: 'evo.facts',
  known_facts: 'evo.facts',
  source_count: 'evo.sources',
  status: 'evo.status',
  image_url: 'evo.photo',
  category: 'evo.category',
  countries: 'evo.countries',
  confidence_status: 'evo.solidity',
  contrast: 'evo.contrast',
}

/**
 * Cronología de la historia viva, como la columna "Minuto a minuto" de un periódico:
 * cuándo apareció cada novedad, qué cambió y qué periódicos se sumaron.
 */
export default function StoryTimeline({ events = [], updates = [] }) {
  const { t, locale } = useI18n()
  const items = [
    ...events.map((e, i) => ({ key: `e${i}`, kind: 'event', at: e.date, title: e.event })),
    ...updates.map((u) => {
      const changes = [...new Set((u.fields_changed || []).map((f) => FIELD_KEYS[f]).filter(Boolean))].map((k) => t(k))
      const sources = String(u.source || '').split(',').map((x) => x.trim()).filter(Boolean)
      return {
        key: u.id,
        kind: 'update',
        at: u.timestamp || u.created_date,
        action: u.action,
        title: t(`change.${u.action}`),
        changes,
        sources: [...new Set(sources)].slice(0, 4),
        version: u.new_version,
      }
    }),
  ].sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
  if (!items.length) return null
  return (
    <ol className="divide-y divide-foreground/25 border-y border-foreground">
      {items.map((item, i) => (
        <li key={item.key} className="flex gap-3 py-3">
          <div className="w-[64px] shrink-0 pt-0.5 text-right">
            <time dateTime={item.at} title={formatDateTime(item.at, locale)} className="block text-[12px] font-semibold tabular-nums">
              {formatDateTime(item.at, locale).split('·').pop()?.trim()}
            </time>
            <span className="block text-[10.5px] italic text-muted-foreground">{formatRelativeTime(item.at, locale)}</span>
          </div>
          <div className={cn('min-w-0 flex-1 border-l pl-3', i === 0 ? 'border-destructive' : 'border-foreground/30')}>
            {item.kind === 'event' ? (
              <p className="font-serif-text text-[15px] leading-snug">{item.title}</p>
            ) : (
              <>
                <p className="font-display text-[16px] font-bold leading-tight">
                  {item.title}
                  {item.version > 1 && <span className="ml-2 text-[11px] font-normal italic text-muted-foreground">{t('story.version', { n: item.version })}</span>}
                </p>
                {item.changes.length > 0 && <p className="mt-0.5 font-serif-text text-[14px] text-foreground/80">{item.changes.join(' · ')}</p>}
                {item.sources.length > 0 && <p className="mt-0.5 text-[12px] italic text-muted-foreground">{t('evo.joined', { sources: item.sources.join(', ') })}</p>}
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
