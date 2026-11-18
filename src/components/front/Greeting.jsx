import moment from 'moment'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCountryName } from '@/lib/countries'

function greetingKey(hour) {
  if (hour >= 6 && hour < 14) return 'greet.morning'
  if (hour >= 14 && hour < 21) return 'greet.afternoon'
  return 'greet.evening'
}

/** Cabecera de periódico: rayas, nombre gótico, línea de fecha y edición, y el saludo. */
export default function Greeting() {
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const now = moment().locale(locale)
  const name = (user?.full_name || '').split(' ')[0]
  const issue = now.dayOfYear() + 1000 * (now.year() - 2025)
  return (
    <motion.header initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="safe-x">
      <div className="rule-thick" />
      <h1 className="font-masthead py-1 text-center text-[clamp(52px,16vw,76px)] leading-[1.05] text-foreground">Renivya</h1>
      <div className="rule-double" />
      <div className="flex items-center justify-between gap-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
        <span className="truncate first-letter:uppercase">{now.format(locale === 'es' ? 'dddd, D [de] MMMM [de] YYYY' : 'dddd, MMMM D, YYYY')}</span>
        <span className="shrink-0">{t('home.number', { n: issue })}</span>
      </div>
      <div className="rule-top" />
      <p className="py-3 text-center font-serif-text text-[19px] italic text-foreground">
        {t(greetingKey(now.hour()))}
        {name && `, ${name}`}
        <span className="not-italic text-muted-foreground"> · {t('home.edition', { country: getCountryName(user?.country || 'ES', locale) })}</span>
      </p>
    </motion.header>
  )
}
