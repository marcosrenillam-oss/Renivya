import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { LOGO_COLORS, buildLogoShapes } from '@/components/branding/logoGeometry'

/**
 * Símbolo RENIVYA (estrella-rosa de 16 puntas).
 * `withWordmark` añade el nombre en Newsreader junto al símbolo.
 */
export default function Logo({ size = 36, withWordmark = false, className, title = 'RENIVYA' }) {
  const shapes = useMemo(() => buildLogoShapes(), [])
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label={title}
        className="shrink-0 drop-shadow-[0_6px_14px_rgba(74,53,40,0.18)]"
      >
        <rect x="0" y="0" width="64" height="64" rx="15" fill={LOGO_COLORS.ivory} />
        <rect x="0.5" y="0.5" width="63" height="63" rx="14.5" fill="none" stroke={LOGO_COLORS.brown} strokeOpacity="0.12" />
        {shapes.short.map((p, i) => (
          <polygon key={`s${i}`} points={p} fill={LOGO_COLORS.terracotta} />
        ))}
        {shapes.longLight.map((p, i) => (
          <polygon key={`l${i}`} points={p} fill={LOGO_COLORS.brown} />
        ))}
        {shapes.longDark.map((p, i) => (
          <polygon key={`d${i}`} points={p} fill={LOGO_COLORS.brown} fillOpacity="0.78" />
        ))}
        <circle cx="32" cy="32" r="6.4" fill={LOGO_COLORS.ivory} />
        <circle cx="32" cy="32" r="4.2" fill={LOGO_COLORS.brown} />
      </svg>
      {withWordmark && (
        <span className="font-heading text-[1.35rem] font-semibold leading-none tracking-[0.08em] text-foreground">RENIVYA</span>
      )}
    </span>
  )
}
