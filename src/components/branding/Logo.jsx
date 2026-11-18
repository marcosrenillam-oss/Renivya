import { cn } from '@/lib/utils'
import { LOGO_COLORS, R_PATH, RULES } from '@/components/branding/logoGeometry'

/**
 * Símbolo RENIVYA: «R» gótica de cabecera entre rayas de portada.
 * `bare` dibuja solo la tinta (en currentColor), sin el papel de fondo.
 */
export default function Logo({ size = 36, bare = false, withWordmark = false, className, title = 'RENIVYA' }) {
  const ink = bare ? 'currentColor' : LOGO_COLORS.ink
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title} className="shrink-0">
        {!bare && <rect x="0" y="0" width="64" height="64" rx="15" fill={LOGO_COLORS.paper} />}
        {RULES.map(([y, h]) => (
          <rect key={y} x="10" y={y - h / 2} width="44" height={h} fill={ink} />
        ))}
        <path d={R_PATH} fill={ink} />
      </svg>
      {withWordmark && <span className="font-masthead text-[1.6rem] leading-none text-foreground">Renivya</span>}
    </span>
  )
}
