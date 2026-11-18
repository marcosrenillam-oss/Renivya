import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import StoryImage from '@/components/story/StoryImage'
import { useI18n } from '@/lib/i18n/I18nContext'
import { haptic } from '@/lib/haptics'

/** Última hora: cápsula de cristal con resplandor rojo que va rotando los titulares urgentes. */
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
      <Link to={`/story/${story.id}`} onClick={() => haptic()} className="relative block">
        <span aria-hidden="true" className="absolute -inset-1 rounded-[26px] bg-destructive/35 blur-xl" />
        <div className="glass-premium relative flex items-center gap-3 overflow-hidden rounded-[22px] p-2 pr-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[15px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={story.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <StoryImage story={story} className="h-full w-full" />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-destructive">
              <span className="live-dot h-2 w-2 rounded-full bg-destructive" />
              {t('home.breaking')}
            </p>
            <div className="relative mt-0.5 h-[40px] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={story.id}
                  initial={{ y: 30, opacity: 0, filter: 'blur(4px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: -30, opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 line-clamp-2 font-display text-[15px] font-semibold leading-[1.25] text-foreground"
                >
                  {story.title}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Link>
    </div>
  )
}
