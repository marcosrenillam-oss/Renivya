import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import NewspaperPage from '@/components/front/NewspaperPage'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

/**
 * Carrusel táctil de primeras planas: se desliza con el dedo (sin barras), con efecto de
 * profundidad y un "tic" háptico en cada periódico.
 */
export default function FrontPageCarousel({ stories, edition }) {
  const ref = useRef(null)
  const navigate = useNavigate()
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)

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
        const a = Math.min(Math.abs(d), 1.4)
        child.style.transform = `perspective(1100px) rotateY(${(-d * 16).toFixed(2)}deg) scale(${(1 - a * 0.07).toFixed(3)})`
        child.style.opacity = String(1 - Math.min(a, 1) * 0.35)
        if (Math.abs(d) < bestDist) {
          bestDist = Math.abs(d)
          best = i
        }
      })
      if (best !== activeRef.current) {
        activeRef.current = best
        setActive(best)
        haptic()
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [stories.length])

  const goTo = (i) => {
    const el = ref.current
    const child = el?.children[i]
    if (!child) return
    el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: 'smooth' })
  }

  if (!stories.length) return null
  // "Además": los titulares de las dos portadas siguientes (como en un periódico real).
  const others = (i) => [1, 2].map((k) => stories[(i + k) % stories.length]).filter((s) => s && s.id !== stories[i].id)
  return (
    <div>
      <div ref={ref} className="no-scrollbar snap-x-mandatory flex gap-4 overflow-x-auto px-[9vw] pb-6 pt-2 sm:px-[calc(50%-190px)]">
        {stories.map((story, i) => (
          <motion.button
            key={story.id}
            type="button"
            onClick={() => {
              haptic('medium')
              if (i === activeRef.current) navigate(`/story/${story.id}`)
              else goTo(i)
            }}
            initial={{ opacity: 0, y: 60, rotate: i === 0 ? -4 : 6 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.08 * Math.min(i, 4), duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="h-[min(132vw,560px)] w-[82vw] max-w-[380px] shrink-0 snap-center will-change-transform"
            style={{ transformOrigin: 'center center' }}
          >
            <NewspaperPage story={story} edition={edition} others={others(i)} />
          </motion.button>
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        {stories.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`${i + 1}`}
            onClick={() => goTo(i)}
            className={cn('h-1.5 rounded-full transition-all duration-300', i === active ? 'w-5 bg-foreground' : 'w-1.5 bg-foreground/25')}
          />
        ))}
      </div>
    </div>
  )
}
