import { useState } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/** Contenedor de gráfico con alternancia gráfico/tabla (accesibilidad: la identidad nunca solo por color). */
export default function ChartCard({ title, subtitle, table, children, className }) {
  const { t } = useI18n()
  const [asTable, setAsTable] = useState(false)
  return (
    <section className={cn('glass-card p-5 sm:p-6', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="type-h3">{title}</h2>
          {subtitle && <p className="type-caption mt-0.5 text-muted-foreground">{subtitle}</p>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            className="type-caption inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-muted-foreground hover:text-foreground"
            aria-pressed={asTable}
          >
            {asTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
            {asTable ? t('analytics.chart') : t('analytics.table')}
          </button>
        )}
      </div>
      {asTable && table ? (
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                {table.columns.map((c) => <th key={c} className="type-caption py-2 pr-3 font-semibold text-muted-foreground">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  {r.map((cell, j) => <td key={j} className={cn('py-1.5 pr-3', j > 0 && 'tabular-nums')}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  )
}

/** Ejes y rejilla recesivos, comunes a todos los gráficos. */
export const axisProps = {
  tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 },
  axisLine: false,
  tickLine: false,
}
export const gridProps = { stroke: 'hsl(var(--border))', strokeDasharray: '0', vertical: false }

export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      {label != null && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color || p.fill }} aria-hidden="true" />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums text-foreground">{formatter ? formatter(p.value, p) : p.value}</span>
        </p>
      ))}
    </div>
  )
}
