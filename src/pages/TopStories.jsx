import { useSearchParams } from 'react-router-dom'
import SectionHeader from '@/components/common/SectionHeader'
import CategoryChips from '@/components/digest/CategoryChips'
import StoryFeed from '@/components/story/StoryFeed'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const STATUSES = ['all', 'live', 'resolved']

export default function TopStories() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const category = params.get('c')
  const status = STATUSES.includes(params.get('s')) ? params.get('s') : 'all'
  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  return (
    <div className="space-y-8">
      <SectionHeader as="h1" size="display" eyebrow={t('app.tagline')} title={t('page.topStories.title')} description={t('top.subtitle')} />
      <div className="space-y-4">
        <CategoryChips value={category} onChange={(c) => update('c', c)} />
        <div className="flex gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => update('s', s)}
              aria-pressed={status === s}
              className={cn('rounded-full px-3 py-1 text-xs font-medium', status === s ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {t(`feed.status${s[0].toUpperCase()}${s.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>
      <StoryFeed ranked category={category} status={status} sort="score" />
    </div>
  )
}
