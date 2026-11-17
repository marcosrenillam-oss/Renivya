import StoryCard from '@/components/story/StoryCard'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function CountryStoryList({ stories }) {
  const { t } = useI18n()
  if (!stories.length) return <p className="type-small py-6 text-muted-foreground">{t('world.noStories')}</p>
  return (
    <div className="divide-y">
      {stories.slice(0, 12).map((s) => (
        <StoryCard key={s.id} story={s} variant="compact" />
      ))}
    </div>
  )
}
