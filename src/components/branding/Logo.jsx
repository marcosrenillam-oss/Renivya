import { cn } from '@/lib/utils'
import { LOGO_COLORS, STARS, starPath } from '@/components/branding/logoGeometry'

/**
 * Símbolo RENIVYA (Cruz del Sur). `bare` dibuja solo las estrellas (en currentColor),
 * para usarlo como botón del menú sobre cualquier fondo.
 */
export default function Logo({ size = 36, bare = false, withWordmark = false, className, title = 'RENIVYA' }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title} className="shrink-0">
        {!bare && (
          <>
            <defs>
              <radialGradient id="renivya-sky" cx="35%" cy="25%" r="90%">
                <stop offset="0" stopColor="#1B2D57" />
                <stop offset="0.55" stopColor={LOGO_COLORS.night} />
                <stop offset="1" stopColor={LOGO_COLORS.nightDeep} />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="64" height="64" rx="15" fill="url(#renivya-sky)" />
          </>
        )}
        {STARS.map((s, i) => (
          <path key={i} d={starPath(s)} fill={bare ? 'currentColor' : LOGO_COLORS.gold} />
        ))}
      </svg>
      {withWordmark && <span className="font-display text-[1.3rem] font-bold leading-none tracking-[0.14em] text-foreground">RENIVYA</span>}
    </span>
  )
}
