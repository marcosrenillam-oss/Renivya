import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { STARS, starPath } from '@/components/branding/logoGeometry'

const TOTAL_MS = 950

/** Pantalla de carga: un periódico llega girando desde el fondo y se posa (< 1 s). */
export default function SplashScreen({ onDone }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const id = setTimeout(onDone, reduced ? 350 : TOTAL_MS)
    return () => clearTimeout(id)
  }, [onDone, reduced])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(120% 80% at 30% 15%, #1B2D57 0%, #0E1A33 45%, #060B17 100%)', perspective: 900 }}
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: reduced ? 0.35 : TOTAL_MS / 1000, times: [0, 0.78, 1], ease: 'easeIn' }}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid slice">
        {STARS.map((s, i) => (
          <motion.path
            key={i}
            d={starPath({ ...s, r: s.r * 0.35 })}
            fill="#E2B550"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.5] }}
            transition={{ duration: 0.7, delay: 0.05 * i }}
          />
        ))}
      </svg>

      <motion.div
        className="newsprint relative w-[168px] rounded-[3px] px-3 pb-3 pt-2.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]"
        initial={reduced ? { opacity: 0 } : { scale: 0.04, rotate: -720, rotateX: 40, opacity: 0, y: -40 }}
        animate={reduced ? { opacity: 1 } : { scale: [0.04, 1.12, 1], rotate: [-720, 8, 0], rotateX: [40, -6, 0], opacity: [0, 1, 1], y: [-40, 4, 0] }}
        transition={{ duration: reduced ? 0.2 : 0.62, times: [0, 0.78, 1], ease: [0.2, 0.8, 0.2, 1] }}
      >
        <p className="font-masthead text-center text-[26px] leading-none text-[#14110d]">Renivya</p>
        <div className="mt-1.5 border-y border-[#14110d]/70 py-[1px]">
          <div className="border-t border-[#14110d]/40" />
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-[7px] w-full rounded-[1px] bg-[#14110d]/85" />
          <div className="h-[7px] w-4/5 rounded-[1px] bg-[#14110d]/85" />
        </div>
        <div className="mt-2 grid grid-cols-[1.3fr_1fr] gap-2">
          <div className="h-[54px] rounded-[1px] bg-[#14110d]/25" />
          <div className="space-y-[3px] pt-0.5">
            {[100, 92, 96, 70, 94, 88, 60].map((w, i) => (
              <div key={i} className="h-[2.5px] rounded bg-[#14110d]/40" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((c) => (
            <div key={c} className="space-y-[3px]">
              {[96, 100, 90, 98, 74].map((w, i) => (
                <div key={i} className="h-[2.5px] rounded bg-[#14110d]/35" style={{ width: `${w - c * 3}%` }} />
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
