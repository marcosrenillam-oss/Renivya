import { useI18n } from '@/lib/i18n/I18nContext'

/** Volumen geográfico (no son métricas de relevancia ni de confianza). */
export default function WorldMetricRow({ totals }) {
  const { t } = useI18n()
  const items = [
    [totals.countries, t('world.countries')],
    [totals.stories, t('world.live')],
    [totals.breaking, t('world.breaking')],
  ]
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3">
      {items.map(([value, label]) => (
        <div key={label}>
          <p className="font-heading text-2xl font-semibold tabular-nums leading-none">{value}</p>
          <p className="type-caption mt-1 text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  )
}
