import { Globe2, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

function greetingKey(date = new Date()) {
  const h = date.getHours()
  if (h < 13) return 'home.greetingMorning'
  if (h < 20) return 'home.greetingAfternoon'
  return 'home.greetingEvening'
}

/** Saludo + titular de portada + selector Mundo / Para ti. */
export default function DigestHeader({ mode, onModeChange }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const first = (user?.full_name || '').split(' ')[0]
  const options = [
    { id: 'world', icon: Globe2, label: t('home.worldMode'), hint: t('home.worldModeHint') },
    { id: 'personal', icon: Sparkles, label: t('home.personalMode'), hint: t('home.personalModeHint') },
  ]
  return (
    <header className="mb-10 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow mb-3">{t(greetingKey())}{first ? `, ${first}` : ''}</p>
        <h1 className="font-heading text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[2.75rem]">{t('home.title')}</h1>
      </div>
      <div role="radiogroup" aria-label={t('settings.digest')} className="inline-flex self-start rounded-full border bg-card/60 p-1 sm:self-auto">
        {options.map(({ id, icon: Icon, label, hint }) => (
          <button
            key={id}
            role="radio"
            aria-checked={mode === id}
            title={hint}
            onClick={() => onModeChange(id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              mode === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </header>
  )
}
