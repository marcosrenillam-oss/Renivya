import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Settings as SettingsIcon } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import InstallPrompt from '@/components/common/InstallPrompt'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getPreference, queryKeys } from '@/lib/dataService'
import { getCountryFlag, getCountryName } from '@/lib/countries'
import { useSavedStories } from '@/hooks/useSavedStories'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function Profile() {
  const { t, locale } = useI18n()
  const { user, logout } = useAuth()
  const pref = useQuery({ queryKey: queryKeys.preference(user?.id), queryFn: getPreference, enabled: Boolean(user) })
  const { ids } = useSavedStories()
  const p = pref.data
  const initials = (user?.full_name || user?.email || '?').split(/[\s@.]+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('')
  const rows = p
    ? [
        [t('profile.mode'), p.world_mode_enabled ? t('home.worldMode') : t('home.personalMode')],
        [t('profile.primaryCountry'), `${getCountryFlag(p.primary_country)} ${getCountryName(p.primary_country, locale)}`],
        [t('profile.categories'), p.preferred_categories?.length ? p.preferred_categories.map((c) => t(`category.${c}`)).join(', ') : t('profile.none')],
        [t('profile.savedCount'), String(ids.size)],
      ]
    : []
  return (
    <div className="space-y-8">
      <SectionHeader as="h1" size="display" title={t('page.profile.title')} description={t('profile.subtitle')} />
      <div className="glass-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <Avatar className="h-16 w-16 border text-lg"><AvatarFallback>{initials}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1">
          <p className="type-h1 truncate">{user?.full_name || user?.email}</p>
          <p className="type-small truncate text-muted-foreground">{user?.email}</p>
          {user?.created_date && <p className="type-caption mt-1 text-muted-foreground">{t('profile.memberSince', { date: formatDate(user.created_date, locale) })}</p>}
        </div>
        <Button variant="outline" onClick={logout}><LogOut />{t('header.signOut')}</Button>
      </div>
      <div className="glass-card p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="type-h2">{t('profile.preferences')}</h2>
          <Button variant="ghost" size="sm" asChild><Link to="/settings"><SettingsIcon />{t('profile.editPreferences')}</Link></Button>
        </div>
        <dl className="divide-y">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-6 py-3">
              <dt className="type-small text-muted-foreground">{label}</dt>
              <dd className="type-small text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="glass-card p-6 sm:p-8">
        <InstallPrompt variant="inline" />
      </div>
    </div>
  )
}
