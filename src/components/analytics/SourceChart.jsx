import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { axisProps, ChartTooltip, gridProps } from '@/components/analytics/ChartCard'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function SourceChart({ data }) {
  const { t } = useI18n()
  return (
    <ChartCard title={t('analytics.bySource')} table={{ columns: [t('story.source'), t('analytics.articles')], rows: data.map((d) => [d.name, d.count]) }}>
      <div style={{ height: Math.max(200, data.length * 30) }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" allowDecimals={false} {...axisProps} />
            <YAxis type="category" dataKey="name" width={150} {...axisProps} />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary) / 0.6)' }} content={<ChartTooltip />} />
            <Bar dataKey="count" name={t('analytics.articles')} fill="var(--viz-2)" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
