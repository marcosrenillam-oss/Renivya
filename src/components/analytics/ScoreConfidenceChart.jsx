import { useNavigate } from 'react-router-dom'
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import ChartCard, { axisProps, gridProps } from '@/components/analytics/ChartCard'
import { useI18n } from '@/lib/i18n/I18nContext'

function PointTooltip({ active, payload }) {
  const { t } = useI18n()
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-strong max-w-[260px] rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-heading text-sm font-semibold leading-snug">{d.title}</p>
      <p className="text-muted-foreground">{t('story.relevance')}: <span className="font-medium text-foreground">{d.score}</span> · {t('story.solidity')}: <span className="font-medium text-foreground">{d.confidence}</span></p>
    </div>
  )
}

/** Relevancia frente a solidez: dos conceptos distintos, un punto por historia. */
export default function ScoreConfidenceChart({ data }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  return (
    <ChartCard
      title={t('analytics.scoreVsConfidence')}
      subtitle={t('analytics.scoreVsConfidenceHint')}
      table={{ columns: [t('analytics.story'), t('story.relevance'), t('story.solidity')], rows: data.map((d) => [d.title, d.score, d.confidence]) }}
    >
      <div className="h-80">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
            <CartesianGrid {...gridProps} vertical />
            <XAxis type="number" dataKey="confidence" name={t('story.solidity')} domain={[0, 100]} {...axisProps} label={{ value: t('story.solidity'), position: 'insideBottom', offset: -8, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <YAxis type="number" dataKey="score" name={t('story.relevance')} domain={[0, 100]} {...axisProps} width={32} />
            <ZAxis range={[80, 80]} />
            <ReferenceLine x={50} stroke="hsl(var(--border))" />
            <ReferenceLine y={50} stroke="hsl(var(--border))" />
            <Tooltip content={<PointTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />
            <Scatter data={data} fill="var(--viz-2)" stroke="hsl(var(--card))" strokeWidth={2} onClick={(d) => d?.id && navigate(`/story/${d.id}`)} className="cursor-pointer" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
