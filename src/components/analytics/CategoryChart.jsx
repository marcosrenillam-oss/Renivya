import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { axisProps, ChartTooltip, gridProps } from '@/components/analytics/ChartCard'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Historias por categoría (una sola serie: magnitud → un color). */
export default function CategoryChart({ data }) {
  const { t } = useI18n()
  const rows = data.map((d) => ({ ...d, label: t(`category.${d.category}`) }))
  return (
    <ChartCard
      title={t('analytics.byCategory')}
      table={{ columns: [t('analytics.category'), t('analytics.stories'), t('analytics.avgScore'), t('analytics.avgConfidence')], rows: rows.map((r) => [r.label, r.count, r.score, r.confidence]) }}
    >
      <div style={{ height: Math.max(220, rows.length * 30) }}>
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }} barCategoryGap={6}>
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" allowDecimals={false} {...axisProps} />
            <YAxis type="category" dataKey="label" width={130} {...axisProps} />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary) / 0.6)' }} content={<ChartTooltip />} />
            <Bar dataKey="count" name={t('analytics.stories')} fill="var(--viz-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
