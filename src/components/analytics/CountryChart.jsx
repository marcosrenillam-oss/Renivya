import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { axisProps, ChartTooltip, gridProps } from '@/components/analytics/ChartCard'
import { getCountryFlag, getCountryName } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function CountryChart({ data }) {
  const { t, locale } = useI18n()
  const rows = data.map((d) => ({ ...d, label: `${getCountryFlag(d.code)} ${getCountryName(d.code, locale)}` }))
  return (
    <ChartCard title={t('analytics.byCountry')} table={{ columns: [t('analytics.country'), t('analytics.stories')], rows: rows.map((r) => [r.label, r.count]) }}>
      <div style={{ height: Math.max(200, rows.length * 30) }}>
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" allowDecimals={false} {...axisProps} />
            <YAxis type="category" dataKey="label" width={140} {...axisProps} />
            <Tooltip cursor={{ fill: 'hsl(var(--secondary) / 0.6)' }} content={<ChartTooltip />} />
            <Bar dataKey="count" name={t('analytics.stories')} fill="var(--viz-3)" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
