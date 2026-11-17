import { useI18n } from '@/lib/i18n/I18nContext'
import { TYPE_COLOR, TYPE_GROUPS } from '@/components/network/networkStyle'
import { cn } from '@/lib/utils'

/** Leyenda + filtros por tipo + recuento. La identidad nunca va solo por color: cada tipo lleva su nombre. */
export default function NetworkDetailPanel({ stats, activeGroups, onToggleGroup }) {
  const { t } = useI18n()
  return (
    <div className="glass-card space-y-5 p-5">
      <div>
        <p className="eyebrow mb-3">{t('network.types')}</p>
        <div className="flex flex-wrap gap-2">
          {TYPE_GROUPS.map(([key, types]) => {
            const on = activeGroups.includes(key)
            return (
              <button key={key} onClick={() => onToggleGroup(key)} aria-pressed={on} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs', on ? 'bg-card' : 'opacity-50')}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR[types[0]] }} aria-hidden="true" />
                {t(`entityType.${key}`)}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="eyebrow mb-2">{t('network.legend')}</p>
        <ul className="type-caption space-y-1.5 text-muted-foreground">
          <li className="flex items-center gap-2"><svg width="28" height="6" aria-hidden="true"><line x1="0" y1="3" x2="28" y2="3" stroke="hsl(var(--foreground))" strokeOpacity="0.35" strokeWidth="2" /></svg>{t('network.cooccurrence')}</li>
          <li className="flex items-center gap-2"><svg width="28" height="6" aria-hidden="true"><line x1="0" y1="3" x2="28" y2="3" stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="5 4" /></svg>{t('network.relation')}</li>
        </ul>
      </div>
      <p className="type-caption text-muted-foreground">
        {t('network.entities', { count: stats.entities })} · {t('network.relations', { count: stats.relations })}
      </p>
    </div>
  )
}
