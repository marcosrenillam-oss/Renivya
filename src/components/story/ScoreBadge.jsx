import { cn } from '@/lib/utils'

/** RENIVYA SCORE (importancia). Solo en el detalle ("Cómo lo medimos") y en Analítica. */
export default function ScoreBadge({ score, label, className }) {
  const value = Math.round(score ?? 0)
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label={`${label}: ${value}/100`}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 28 28)"
        />
        <text x="28" y="33" textAnchor="middle" className="fill-foreground font-heading text-[15px] font-semibold">{value}</text>
      </svg>
      {label && <span className="type-small font-medium">{label}</span>}
    </div>
  )
}
