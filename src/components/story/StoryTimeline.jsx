import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const ACTION_TONE = {
  created: 'bg-muted-foreground',
  updated: 'bg-accent',
  breaking: 'bg-primary',
  correction: 'bg-warning',
  resolved: 'bg-success',
  archived: 'bg-muted-foreground',
  merged: 'bg-accent',
  split: 'bg-accent',
}

/**
 * Cronología: acontecimientos (Story.timeline) e historial de la Story viva (StoryUpdate).
 * Nunca muestra SCORE ni confianza; solo qué ha cambiado, cuándo y en qué versión.
 */
export default function StoryTimeline({ events = [], updates = [] }) {
  const { t, locale } = useI18n()
  const items = [
    ...events.map((e, i) => ({ key: `e${i}`, kind: 'event', at: e.date, title: e.event })),
    ...updates.map((u) => ({
      key: u.id,
      kind: 'update',
      at: u.timestamp || u.created_date,
      action: u.action,
      title: t(`change.${u.action}`),
      lines: u.whats_changed?.length ? u.whats_changed : u.summary_of_change ? [u.summary_of_change] : [],
      version: u.new_version,
    })),
  ].sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
  if (!items.length) return null
  return (
    <ol className="relative space-y-6 border-l pl-6">
      {items.map((item) => (
        <li key={item.key} className="relative">
          <span
            className={cn('absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background', item.kind === 'event' ? 'bg-border' : ACTION_TONE[item.action] || 'bg-accent')}
            aria-hidden="true"
          />
          <time dateTime={item.at} title={formatDateTime(item.at, locale)} className="type-caption text-muted-foreground">
            {formatRelativeTime(item.at, locale)}
          </time>
          {item.kind === 'event' ? (
            <p className="type-small mt-1">{item.title}</p>
          ) : (
            <div className="mt-1">
              <p className="text-sm font-semibold">
                {item.title}
                {item.version ? <span className="type-caption ml-2 font-normal text-muted-foreground">{t('story.version', { n: item.version })}</span> : null}
              </p>
              {item.lines.map((line, i) => (
                <p key={i} className="type-small mt-1 text-muted-foreground">{line}</p>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}
