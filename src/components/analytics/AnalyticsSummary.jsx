import { useI18n } from '@/lib/i18n/I18nContext'

/** Cifras de cabecera como tiles: número protagonista + etiqueta. */
export default function AnalyticsSummary({ totals }) {
  const { t } = useI18n()
  const tiles = [
    ['analytics.stories', totals.stories],
    ['analytics.live', totals.live],
    ['analytics.sources', totals.sources],
    ['analytics.avgScore', totals.avgScore],
    ['analytics.avgConfidence', totals.avgConfidence],
    ['analytics.contradictions', totals.contradictions],
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map(([key, value]) => (
        <div key={key} className="glass-card p-4">
          <p className="font-heading text-3xl font-semibold tabular-nums leading-none">{value}</p>
          <p className="type-caption mt-2 text-muted-foreground">{t(key)}</p>
        </div>
      ))}
    </div>
  )
}
