import StoryCard from '@/components/story/StoryCard'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function HomeLead({ story }) {
  const { t } = useI18n()
  if (!story) return null
  return (
    <section aria-label={t('home.lead')}>
      <StoryCard story={story} variant="lead" />
    </section>
  )
}
