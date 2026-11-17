import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import InstallPrompt from '@/components/common/InstallPrompt'
import Spinner from '@/components/common/Spinner'
import CategoryBoard from '@/components/settings/CategoryBoard'
import TagInput from '@/components/settings/TagInput'
import { RangeField, SettingsCard, SettingsRow } from '@/components/settings/SettingsField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { getPreference, queryKeys, savePreference } from '@/lib/dataService'
import { listCountries } from '@/lib/countries'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const EDITABLE = [
  'world_mode_enabled', 'primary_country', 'digest_size', 'preferred_categories', 'excluded_categories', 'followed_countries',
  'followed_entities', 'excluded_entities', 'keywords', 'minimum_score', 'minimum_confidence', 'digest_frequency',
  'daily_briefing_time', 'weekly_summary_enabled', 'alert_threshold', 'preferred_languages',
]

function pick(pref) {
  return Object.fromEntries(EDITABLE.map((k) => [k, pref?.[k] ?? null]))
}

export default function Settings() {
  const { t, locale, setLocale, locales } = useI18n()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = queryKeys.preference(user?.id)
  const prefQ = useQuery({ queryKey: key, queryFn: getPreference, enabled: Boolean(user) })
  const [form, setForm] = useState(null)
  const countries = useMemo(() => listCountries(locale), [locale])

  useEffect(() => {
    if (prefQ.data && !form) setForm(pick(prefQ.data))
  }, [prefQ.data, form])

  const dirty = form && prefQ.data && JSON.stringify(form) !== JSON.stringify(pick(prefQ.data))
  const save = useMutation({
    mutationFn: () => savePreference(form),
    onSuccess: (saved) => {
      qc.setQueryData(key, saved)
      setForm(pick(saved))
      qc.invalidateQueries({ queryKey: ['stories'] })
      toast({ title: t('settings.saved') })
    },
    onError: () => toast({ title: t('settings.saveError'), variant: 'destructive' }),
  })

  if (prefQ.isLoading || !form) return <Spinner label={t('common.loading')} />
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  return (
    <div className="space-y-8 pb-24">
      <SectionHeader as="h1" size="display" title={t('page.settings.title')} description={t('settings.subtitle')} />

      <SettingsCard title={t('settings.digest')}>
        <SettingsRow label={t('settings.worldMode')} hint={t('settings.worldModeHint')} htmlFor="world-mode">
          <Switch id="world-mode" checked={form.world_mode_enabled} onCheckedChange={(v) => set({ world_mode_enabled: v })} />
        </SettingsRow>
        <SettingsRow label={t('settings.primaryCountry')} hint={t('settings.primaryCountryHint')}>
          <Select value={form.primary_country || 'ES'} onValueChange={(v) => set({ primary_country: v })}>
            <SelectTrigger className="w-56" aria-label={t('settings.primaryCountry')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label={t('settings.digestSize')}>
          <Select value={String(form.digest_size ?? 10)} onValueChange={(v) => set({ digest_size: Number(v) })}>
            <SelectTrigger className="w-28" aria-label={t('settings.digestSize')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title={t('settings.categories')} description={t('settings.categoriesHint')}>
        <CategoryBoard preferred={form.preferred_categories || []} excluded={form.excluded_categories || []} onChange={set} />
      </SettingsCard>

      <SettingsCard title={t('settings.follow')}>
        <div>
          <p className="type-small mb-2 font-medium">{t('settings.followedCountries')}</p>
          <div className="flex flex-wrap gap-1.5">
            {(form.followed_countries || []).map((c) => (
              <button key={c} onClick={() => set({ followed_countries: form.followed_countries.filter((x) => x !== c) })} className="rounded-full bg-secondary px-2.5 py-1 text-xs hover:bg-secondary/70">
                {countries.find((x) => x.code === c)?.flag} {countries.find((x) => x.code === c)?.name ?? c} ×
              </button>
            ))}
            <Select value="" onValueChange={(v) => set({ followed_countries: [...new Set([...(form.followed_countries || []), v])] })}>
              <SelectTrigger className="h-8 w-44 text-xs" aria-label={t('settings.followedCountries')}><SelectValue placeholder="+" /></SelectTrigger>
              <SelectContent>
                {countries.filter((c) => !(form.followed_countries || []).includes(c.code)).map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <TagInput id="followed-entities" label={t('settings.followedEntities')} placeholder={t('settings.addPlaceholder')} value={form.followed_entities || []} onChange={(v) => set({ followed_entities: v })} />
        <TagInput id="keywords" label={t('settings.keywords')} placeholder={t('settings.addPlaceholder')} value={form.keywords || []} onChange={(v) => set({ keywords: v })} />
        <TagInput id="excluded-entities" label={t('settings.excludedEntities')} placeholder={t('settings.addPlaceholder')} value={form.excluded_entities || []} onChange={(v) => set({ excluded_entities: v })} />
      </SettingsCard>

      <SettingsCard title={t('settings.filters')} description={t('settings.filtersHint')}>
        <SettingsRow label={t('settings.minimumScore')} htmlFor="min-score">
          <RangeField id="min-score" value={form.minimum_score ?? 0} onChange={(v) => set({ minimum_score: v })} />
        </SettingsRow>
        <SettingsRow label={t('settings.minimumConfidence')} htmlFor="min-conf">
          <RangeField id="min-conf" value={form.minimum_confidence ?? 0} onChange={(v) => set({ minimum_confidence: v })} />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title={t('settings.notifications')}>
        <SettingsRow label={t('settings.frequency')}>
          <Select value={form.digest_frequency || 'daily'} onValueChange={(v) => set({ digest_frequency: v })}>
            <SelectTrigger className="w-44" aria-label={t('settings.frequency')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {['daily', 'weekly', 'realtime'].map((f) => <SelectItem key={f} value={f}>{t(`settings.frequency.${f}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label={t('settings.briefingTime')} htmlFor="briefing-time">
          <Input id="briefing-time" type="time" className="w-32" value={form.daily_briefing_time || ''} onChange={(e) => set({ daily_briefing_time: e.target.value || null })} />
        </SettingsRow>
        <SettingsRow label={t('settings.weeklySummary')} htmlFor="weekly">
          <Switch id="weekly" checked={Boolean(form.weekly_summary_enabled)} onCheckedChange={(v) => set({ weekly_summary_enabled: v })} />
        </SettingsRow>
        <SettingsRow label={t('settings.alertThreshold')} htmlFor="alert">
          <RangeField id="alert" value={form.alert_threshold ?? 80} min={50} onChange={(v) => set({ alert_threshold: v })} />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title={t('settings.appearance')}>
        <SettingsRow label={t('settings.theme')}>
          <div role="radiogroup" aria-label={t('settings.theme')} className="inline-flex rounded-full border bg-card/60 p-1">
            {['light', 'dark', 'system'].map((th) => (
              <button key={th} role="radio" aria-checked={theme === th} onClick={() => setTheme(th)} className={cn('rounded-full px-3 py-1 text-xs font-medium', theme === th ? 'bg-foreground text-background' : 'text-muted-foreground')}>
                {t(`header.theme${th[0].toUpperCase()}${th.slice(1)}`)}
              </button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label={t('settings.language')}>
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger className="w-40" aria-label={t('settings.language')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {locales.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title={t('settings.install')}>
        <InstallPrompt variant="inline" />
      </SettingsCard>

      <div className="glass-strong fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl p-3 pl-5 md:bottom-6 md:left-[calc(76px+env(safe-area-inset-left)+1.5rem)] xl:left-[calc(16rem+1.5rem)]">
        <span className="type-small text-muted-foreground">{dirty ? t('settings.unsaved') : t('settings.saved')}</span>
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />}
          {save.isPending ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  )
}
