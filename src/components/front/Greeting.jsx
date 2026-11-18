import moment from 'moment'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'

function greetingKey(hour) {
  if (hour >= 6 && hour < 14) return 'greet.morning'
  if (hour >= 14 && hour < 21) return 'greet.afternoon'
  return 'greet.evening'
}

/** Fecha de hoy y saludo con el nombre del lector. */
export default function Greeting() {
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const now = moment().locale(locale)
  const name = (user?.full_name || '').split(' ')[0]
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="safe-x pt-3">
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground first-letter:uppercase">{now.format(locale === 'es' ? 'dddd, D [de] MMMM' : 'dddd, MMMM D')}</p>
      <h1 className="mt-1.5 font-display text-[34px] font-bold leading-[1.05] tracking-[-0.01em] text-foreground">
        {t(greetingKey(now.hour()))}
        {name && (
          <>
            ,<br />
            <span className="italic text-accent">{name}</span>
          </>
        )}
      </h1>
    </motion.div>
  )
}
