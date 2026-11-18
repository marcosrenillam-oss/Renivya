import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import NewspaperPage from '@/components/front/NewspaperPage'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 5200
const IDLE_MS = 7000

/**
 * Primeras planas en 3D (coverflow): se deslizan con el dedo y, si no tocas, pasan solas.
 * Cada periódico flota y lo recorre un brillo; el del centro se ve en color.
 */
export default function FrontPageCarousel({ stories, edition }) {
  const ref = useRef(null)
  const navigate = useNavigate()
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const lastTouch = useRef(0)
  const userDriven = useRef(false)

  const goTo = useCallback((i, smooth = true) => {
    const el = ref.current
    const child = el?.children[i]
    if (!child) return
    el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // Coverflow: cada periódico gira, se aleja y se apaga según su distancia al centro.
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      const box = el.getBoundingClientRect()
      const center = box.left + box.width / 2
      let best = 0
      let bestDist = Infinity
      ;[...el.children].forEach((child, i) => {
        const r = child.getBoundingClientRect()
        const d = (r.left + r.width / 2 - center) / r.width
        const a = Math.min(Math.abs(d), 1.6)
        child.style.transform = `perspective(1200px) translate3d(${(-d * 18).toFixed(1)}px,0,${(-a * 140).toFixed(1)}px) rotateY(${(-d * 32).toFixed(2)}deg)`
        child.style.opacity = String(1 - Math.min(a, 1.2) * 0.42)
        child.style.zIndex = String(100 - Math.round(a * 10))
        child.style.filter = a > 0.15 ? `saturate(${(1 - a * 0.4).toFixed(2)}) brightness(${(1 - a * 0.12).toFixed(2)})` : 'none'
        if (Math.abs(d) < bestDist) {
          bestDist = Math.abs(d)
          best = i
        }
      })
      if (best !== activeRef.current) {
        activeRef.current = best
        setActive(best)
        if (userDriven.current) haptic()
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const touched = () => {
      lastTouch.current = Date.now()
      userDriven.current = true
    }
    update()
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('pointerdown', touched, { passive: true })
    el.addEventListener('touchstart', touched, { passive: true })
    el.addEventListener('wheel', touched, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointerdown', touched)
      el.removeEventListener('touchstart', touched)
      el.removeEventListener('wheel', touched)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [stories.length])

  // Pasan solos cuando no los tocas (y vuelven al primero al llegar al final).
  useEffect(() => {
    if (stories.length < 2) return undefined
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return undefined
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible' || Date.now() - lastTouch.current < IDLE_MS) return
      userDriven.current = false
      goTo((activeRef.current + 1) % stories.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [stories.length, goTo])

  if (!stories.length) return null
  // "Además": titulares de las dos portadas siguientes, como en un periódico de verdad.
  const others = (i) => [1, 2].map((k) => stories[(i + k) % stories.length]).filter((s) => s && s.id !== stories[i].id)

  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar snap-x-mandatory flex gap-3 overflow-x-auto px-[10vw] pb-10 pt-4 sm:px-[calc(50%-185px)]" style={{ perspective: '1200px' }}>
        {stories.map((story, i) => (
          <motion.button
            key={story.id}
            type="button"
            onClick={() => {
              haptic('medium')
              lastTouch.current = Date.now()
              if (i === activeRef.current) navigate(`/story/${story.id}`)
              else {
                userDriven.current = true
                goTo(i)
              }
            }}
            initial={{ opacity: 0, y: 90, rotateX: 35, rotateZ: i % 2 ? 7 : -7 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, rotateZ: 0 }}
            transition={{ delay: 0.1 + 0.09 * Math.min(i, 4), duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[min(134vw,570px)] w-[80vw] max-w-[370px] shrink-0 snap-center will-change-transform [transform-style:preserve-3d]"
          >
            <div className="paper-float h-full w-full" style={{ animationDelay: `${-i * 1.3}s` }}>
              <NewspaperPage story={story} edition={edition} others={others(i)} active={i === active} />
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-7 left-[8%] h-6 w-[84%] rounded-[50%] bg-black/35 blur-xl dark:bg-black/70" />
          </motion.button>
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        {stories.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`${i + 1}`}
            onClick={() => {
              lastTouch.current = Date.now()
              userDriven.current = true
              goTo(i)
            }}
            className={cn('relative h-1.5 overflow-hidden rounded-full transition-all duration-500', i === active ? 'w-8 bg-foreground/15' : 'w-1.5 bg-foreground/25')}
          >
            {i === active && (
              <motion.span
                key={`p${active}`}
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
