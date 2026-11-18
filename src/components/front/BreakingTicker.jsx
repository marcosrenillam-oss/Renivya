import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { haptic } from '@/lib/haptics'

/** Última hora: banda roja que va rotando los titulares urgentes. */
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
      <Link
        to={`/story/${story.id}`}
        onClick={() => haptic()}
        className="flex items-stretch overflow-hidden rounded-2xl bg-destructive text-destructive-foreground shadow-[0_14px_30px_-18px_hsl(var(--destructive))] active:scale-[0.99]"
      >
        <span className="flex shrink-0 items-center gap-2 bg-black/15 px-3 text-[11px] font-bold uppercase tracking-[0.14em]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          {t('home.breaking')}
        </span>
        <span className="relative min-h-[52px] flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={story.id}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center px-3 font-display text-[15px] font-semibold leading-tight"
            >
              <span className="line-clamp-2">{story.title}</span>
            </motion.span>
          </AnimatePresence>
        </span>
        <ChevronRight className="mr-2 h-4 w-4 shrink-0 self-center opacity-80" />
      </Link>
    </div>
  )
}
