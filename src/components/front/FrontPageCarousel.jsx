import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import NewspaperPage from '@/components/front/NewspaperPage'
import { haptic } from '@/lib/haptics'
import { openStory } from '@/lib/storyTransition'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 5200
const IDLE_MS = 6000
const EASE = [0.32, 0.72, 0, 1]

/** Distancia (en periódicos) entre la carta i y la posición actual, en un círculo sin fin. */
function wrapOffset(i, pos, n) {
  let d = (((i - pos) % n) + n) % n
  if (d > n / 2) d -= n
  return d
}

function Paper({ index, count, pos, cardW, story, edition, others, active, onTap }) {
  const offset = useTransform(pos, (p) => wrapOffset(index, p, count))
  const x = useTransform(offset, (o) => o * cardW * 0.74)
  const z = useTransform(offset, (o) => -Math.min(Math.abs(o), 2.5) * 170)
  const rotateY = useTransform(offset, (o) => Math.max(-55, Math.min(55, -o * 34)))
  const scale = useTransform(offset, (o) => 1 - Math.min(Math.abs(o), 2) * 0.06)
  const opacity = useTransform(offset, (o) => (Math.abs(o) > 2.2 ? 0 : 1 - Math.min(Math.abs(o), 1.5) * 0.3))
  const zIndex = useTransform(offset, (o) => 100 - Math.round(Math.abs(o) * 10))
  const brightness = useTransform(offset, (o) => `brightness(${1 - Math.min(Math.abs(o), 1.5) * 0.1})`)

  return (
    <motion.div
      className="absolute left-1/2 top-0 h-full will-change-transform [transform-style:preserve-3d]"
      style={{ width: cardW, marginLeft: -cardW / 2, x, z, rotateY, scale, opacity, zIndex, filter: brightness }}
      onTap={() => onTap(index)}
    >
      <motion.div
        className="h-full w-full"
        initial={{ opacity: 0, y: 70, rotateX: 25 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.1 + 0.08 * Math.min(index, 4), duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="paper-float h-full w-full" style={{ animationDelay: `${-index * 1.3}s` }}>
          <NewspaperPage story={story} edition={edition} others={others} active={active} />
        </div>
      </motion.div>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-6 left-[8%] h-5 w-[84%] rounded-[50%] bg-black/30 blur-xl" />
    </motion.div>
  )
}

/**
 * Primeras planas en 3D. Se arrastran con el dedo (sin barras ni saltos), giran en círculo sin
 * fin y, si no las tocas, pasan solas. Un "tic" háptico al cambiar de periódico.
 */
export default function FrontPageCarousel({ stories, edition }) {
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const pos = useMotionValue(0)
  const [cardW, setCardW] = useState(320)
  const [active, setActive] = useState(0)
  const [cycle, setCycle] = useState(0) // reinicia la barra de progreso
  const lastTouch = useRef(0)
  const panStart = useRef(0)
  const anim = useRef(null)
  const panned = useRef(0) // momento del último arrastre: un toque justo después no abre la noticia
  const n = stories.length

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setCardW(Math.min(370, e.contentRect.width * 0.8)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useMotionValueEvent(pos, 'change', (p) => {
    const i = ((Math.round(p) % n) + n) % n
    if (i !== active) {
      setActive(i)
      if (Date.now() - lastTouch.current < 1500) haptic()
    }
  })

  const goTo = useCallback(
    (target) => {
      anim.current?.stop()
      anim.current = animate(pos, target, { duration: 0.75, ease: EASE })
      setCycle((c) => c + 1)
    },
    [pos]
  )

  // Paso automático cuando no se toca.
  useEffect(() => {
    if (n < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible' || Date.now() - lastTouch.current < IDLE_MS) return
      goTo(Math.round(pos.get()) + 1)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [n, goTo, pos])

  const touch = () => {
    lastTouch.current = Date.now()
  }

  const onTap = (i) => {
    if (Date.now() - panned.current < 300) return
    touch()
    const offset = wrapOffset(i, pos.get(), n)
    if (Math.abs(offset) < 0.3) {
      haptic('medium')
      const img = wrapRef.current?.querySelectorAll('article.newsprint')[i]?.querySelector('img')
      if (document.startViewTransition && img) openStory(null, navigate, stories[i].id, img)
      else navigate(`/story/${stories[i].id}`)
    } else goTo(Math.round(pos.get() + offset))
  }

  if (!n) return null
  const others = (i) => [1, 2].map((k) => stories[(i + k) % n]).filter((s) => s && s.id !== stories[i].id)

  return (
    <div>
      <motion.div
        ref={wrapRef}
        className="relative h-[min(134vw,570px)] w-full select-none overflow-hidden pb-2 pt-3"
        style={{ perspective: 1200, touchAction: 'pan-y' }}
        onPanStart={() => {
          touch()
          anim.current?.stop()
          panStart.current = pos.get()
        }}
        onPan={(_, info) => {
          touch()
          pos.set(panStart.current - info.offset.x / (cardW * 0.74))
        }}
        onPanEnd={(_, info) => {
          touch()
          panned.current = Date.now()
          const projected = panStart.current - (info.offset.x + info.velocity.x * 0.18) / (cardW * 0.74)
          const step = Math.max(-2, Math.min(2, Math.round(projected - panStart.current)))
          goTo(Math.round(panStart.current) + step)
        }}
      >
        {stories.map((story, i) => (
          <Paper key={story.id} index={i} count={n} pos={pos} cardW={cardW} story={story} edition={edition} others={others(i)} active={i === active} onTap={onTap} />
        ))}
      </motion.div>
      <div className="mt-3 flex justify-center gap-1.5">
        {stories.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`${i + 1}`}
            onClick={() => {
              touch()
              goTo(Math.round(pos.get() + wrapOffset(i, pos.get(), n)))
            }}
            className={cn('relative h-1.5 overflow-hidden rounded-full transition-all duration-500', i === active ? 'w-8 bg-foreground/15' : 'w-1.5 bg-foreground/25')}
          >
            {i === active && (
              <motion.span
                key={`${active}-${cycle}`}
                className="absolute inset-y-0 left-0 rounded-full bg-foreground"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
