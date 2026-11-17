import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { loadLandDots } from '@/lib/worldGeo'
import { layoutCallouts } from '@/lib/worldCallouts'
import { getCountryName } from '@/lib/countries'
import { GlobeScene } from '@/components/world/WorldScene'
import { cn } from '@/lib/utils'

/** Globo 3D con etiquetas HTML de los países más activos en la cara visible. */
export default function WorldGlobe({ countries = [], selected, onSelect, className }) {
  const { t, locale } = useI18n()
  const { resolvedTheme } = useTheme()
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const [callouts, setCallouts] = useState([])
  onSelectRef.current = onSelect

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let frameCount = 0
    const scene = new GlobeScene(canvasRef.current, {
      reducedMotion: reduced,
      onPick: (code) => onSelectRef.current?.(code),
      onFrame: () => {
        if (++frameCount % 6 === 0) setCallouts(layoutCallouts(scene.project()))
      },
    })
    sceneRef.current = scene
    loadLandDots().then((pts) => sceneRef.current === scene && scene.setLand(pts)).catch(() => {})
    const ro = new ResizeObserver(([entry]) => scene.resize(entry.contentRect.width, entry.contentRect.height))
    ro.observe(wrapRef.current)
    return () => {
      ro.disconnect()
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.applyTheme()
  }, [resolvedTheme])

  useEffect(() => {
    sceneRef.current?.setMarkers(countries.map((c) => ({ code: c.code, intensity: c.intensity, breaking: c.breaking })))
  }, [countries])

  useEffect(() => {
    sceneRef.current?.setSelected(selected)
    if (selected) sceneRef.current?.focus(selected)
  }, [selected])

  return (
    <div ref={wrapRef} className={cn('relative touch-none select-none', className)}>
      <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" aria-label={t('world.dragHint')} role="img" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {callouts.map((c) => (
          <span
            key={c.code}
            className={cn(
              'absolute -translate-x-1/2 -translate-y-[170%] whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm transition-opacity',
              c.code === selected ? 'bg-primary text-primary-foreground' : 'glass-strong text-foreground'
            )}
            style={{ left: c.x, top: c.y }}
          >
            {getCountryName(c.code, locale)}
          </span>
        ))}
      </div>
      <p className="type-caption pointer-events-none absolute bottom-2 left-1/2 w-full -translate-x-1/2 px-4 text-center text-muted-foreground/80">{t('world.dragHint')}</p>
    </div>
  )
}
