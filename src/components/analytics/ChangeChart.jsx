import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { axisProps, ChartTooltip, gridProps } from '@/components/analytics/ChartCard'
import { formatDate } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Orden fijo de tipos de cambio → orden fijo de color (nunca ciclado). */
const SERIES = [
  ['new', 'var(--viz-1)'],
  ['additional', 'var(--viz-2)'],
  ['evolution', 'var(--viz-3)'],
  ['correction', 'var(--viz-4)'],
  ['contradiction', 'var(--viz-5)'],
]

export default function ChangeChart({ data }) {
  const { t, locale } = useI18n()
  const rows = data.map((d) => ({ ...d, label: formatDate(d.day, locale, 'D MMM') }))
  return (
    <ChartCard
      title={t('analytics.changes')}
      subtitle={t('analytics.changesHint')}
      table={{ columns: [t('analytics.day'), ...SERIES.map(([k]) => t(`analytics.change.${k}`))], rows: rows.map((r) => [r.label, ...SERIES.map(([k]) => r[k])]) }}
    >
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ top: 4, right: 8, left: -12 }} barCategoryGap="28%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary) / 0.6)' }} content={<ChartTooltip />} />
            <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
            {SERIES.map(([key, color], i) => (
              <Bar
                key={key}
                dataKey={key}
                name={t(`analytics.change.${key}`)}
                stackId="c"
                fill={color}
                stroke="hsl(var(--card))"
                strokeWidth={2}
                radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={22}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
