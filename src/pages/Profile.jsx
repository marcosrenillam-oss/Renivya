import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Check, ChevronRight, LogOut, Mail } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import InstallPrompt from '@/components/common/InstallPrompt'
import PushSettings from '@/components/settings/PushSettings'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { useTheme } from '@/lib/ThemeContext'
import { useTextSize } from '@/lib/textSize'
import { getCountryName } from '@/lib/countries'
import { flagEmoji } from '@/lib/flags'
import { haptic } from '@/lib/haptics'
import { formatRelativeTime } from '@/lib/format'
import { getSnapshotMeta } from '@/lib/snapshotSync'
import { cn } from '@/lib/utils'
import { EDITIONS } from '../../engine/sourceCatalog.js'

function Group({ title, children }) {
  return (
    <section>
      <h2 className="mb-1 text-[12px] font-bold uppercase tracking-[0.18em] text-foreground">{title}</h2>
      <div className="overflow-hidden border-y border-foreground">{children}</div>
    </section>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex border border-foreground">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => {
            haptic()
            onChange(o.value)
          }}
          className={cn('flex-1 py-2 text-[13px] font-semibold uppercase tracking-[0.1em] transition', value === o.value ? 'bg-foreground text-background' : 'text-muted-foreground')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Perfil: cuenta, país de la edición, idioma, aspecto y resumen semanal. */
export default function Profile() {
  const { user, updateMe, logout } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const [textSize, setTextSize] = useTextSize()
  const qc = useQueryClient()
  const [name, setName] = useState(user?.full_name || '')
  const [savedName, setSavedName] = useState(false)
  const meta = getSnapshotMeta()
  const country = user?.country || 'ES'

  const saveName = async () => {
    if (!name.trim() || name.trim() === user?.full_name) return
    await updateMe({ full_name: name.trim() })
    haptic()
    setSavedName(true)
    setTimeout(() => setSavedName(false), 1500)
  }

  const changeLocale = async (code) => {
    setLocale(code)
    await updateMe({ locale: code })
  }

  const changeCountry = async (code) => {
    haptic()
    await updateMe({ country: code })
    qc.invalidateQueries()
  }

  const initial = (user?.full_name || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="safe-x space-y-7 pt-3">
      <header className="flex items-center gap-4">
        <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-foreground font-masthead text-[38px] text-background">{initial}</span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[28px] font-black leading-tight">{user?.full_name}</h1>
          <p className="truncate text-[14px] text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      <Group title={t('profile.name')}>
        <div className="flex items-center gap-2 p-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[16px] outline-none"
            aria-label={t('profile.name')}
          />
          {savedName && (
            <span className="flex items-center gap-1 pr-2 text-[13px] text-accent">
              <Check className="h-4 w-4" /> {t('profile.saved')}
            </span>
          )}
        </div>
      </Group>

      <Group title={t('profile.country')}>
        <div className="grid grid-cols-2 gap-px bg-foreground/25">
          {EDITIONS.map((code) => (
            <button key={code} type="button" onClick={() => changeCountry(code)} className={cn('flex items-center gap-2.5 bg-background px-3 py-3.5 text-left text-[15px] transition active:scale-[0.98]', country === code && 'font-semibold')}>
              <span className="text-[22px] leading-none">{flagEmoji(code)}</span>
              <span className="flex-1 truncate">{getCountryName(code, locale)}</span>
              {country === code && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t('profile.language')}>
        <div className="p-2">
          <Segmented options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} value={locale} onChange={changeLocale} />
        </div>
      </Group>

      <Group title={t('profile.theme')}>
        <div className="p-2">
          <Segmented
            options={[
              { value: 'light', label: t('profile.themeLight') },
              { value: 'dark', label: t('profile.themeDark') },
              { value: 'system', label: t('profile.themeSystem') },
            ]}
            value={theme}
            onChange={setTheme}
          />
        </div>
      </Group>

      <Group title={t('profile.textSize')}>
        <div className="p-2">
          <Segmented
            options={[
              { value: 'small', label: t('profile.textSmall') },
              { value: 'normal', label: t('profile.textNormal') },
              { value: 'large', label: t('profile.textLarge') },
            ]}
            value={textSize}
            onChange={setTextSize}
          />
        </div>
      </Group>

      <Group title={t('push.title')}>
        <div className="px-1">
          <PushSettings />
        </div>
      </Group>

      <Group title={t('profile.weekly')}>
        <div className="flex items-start gap-3 p-4">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.7} />
          <div className="flex-1">
            <p className="text-[15px]">{t('profile.weeklyBody')}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{user?.email}</p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('profile.soon')}</span>
        </div>
      </Group>

      <div className="overflow-hidden border-y border-foreground">
        <Link to="/saved" className="flex items-center gap-3 px-4 py-4 text-[15px] active:bg-muted">
          <Bookmark className="h-5 w-5 text-accent" strokeWidth={1.7} />
          <span className="flex-1">{t('nav.saved')}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <section>
        <h2 className="mb-1 text-[12px] font-bold uppercase tracking-[0.18em] text-foreground">{t('profile.app')}</h2>
        <InstallPrompt />
      </section>

      <button
        type="button"
        onClick={() => {
          haptic('medium')
          logout()
        }}
        className="flex w-full items-center justify-center gap-2 border-y-2 border-foreground py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-destructive active:bg-muted"
      >
        <LogOut className="h-4 w-4" /> {t('profile.logout')}
      </button>

      <div className="space-y-1 pb-4 text-center text-[12px] text-muted-foreground">
        <p>{t('profile.storage')}</p>
        {meta?.generated_at && <p>{t('profile.updated', { time: formatRelativeTime(meta.generated_at) })}</p>}
      </div>
    </div>
  )
}
