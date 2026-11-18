import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n/I18nContext'
import { haptic } from '@/lib/haptics'

/** Última hora: banda roja de periódico con los titulares urgentes rotando. */
export default function BreakingTicker({ stories }) {
  const { t } = useI18n()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (stories.length < 2) return undefined
    const id = setInterval(() => setI((n) => (n + 1) % stories.length), 4200)
    return () => clearInterval(id)
  }, [stories.length])
  if (!stories.length) return null
  const story = stories[i % stories.length]
  return (
    <div className="safe-x">
      <Link to={`/story/${story.id}`} onClick={() => haptic()} className="flex items-stretch border-y-2 border-destructive active:opacity-70">
        <span className="flex shrink-0 items-center gap-1.5 bg-destructive px-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          {t('home.breaking')}
        </span>
        <span className="relative min-h-[50px] flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={story.id}
              initial={{ y: 26, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -26, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center px-3 font-display text-[15px] font-bold leading-tight text-foreground"
            >
              <span className="line-clamp-2">{story.title}</span>
            </motion.span>
          </AnimatePresence>
        </span>
      </Link>
    </div>
  )
}
