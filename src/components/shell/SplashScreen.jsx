import { useEffect } from 'react'
import { motion } from 'framer-motion'

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
      className="grain fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(120% 90% at 50% 40%, #f4f1ea 0%, #e6e1d6 70%, #d9d3c6 100%)', perspective: 900 }}
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: reduced ? 0.35 : TOTAL_MS / 1000, times: [0, 0.78, 1], ease: 'easeIn' }}
      aria-hidden="true"
    >
      <motion.div
        className="newsprint relative w-[168px] rounded-[3px] px-3 pb-3 pt-2.5 shadow-[0_30px_50px_-20px_rgba(0,0,0,0.45),0_6px_14px_-6px_rgba(0,0,0,0.25)]"
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
