import { Link } from 'react-router-dom'
import { getHeadline } from '@/lib/headline'
import { getStoryInLocale } from '@/lib/i18n/storyLocale'
import { useI18n } from '@/lib/i18n/I18nContext'
import CategoryChip from '@/components/story/CategoryChip'

/** Briefing: las 5 historias del día en una columna de lectura rápida. Sin métricas. */
export default function DailySummary({ stories = [] }) {
  const { t, locale } = useI18n()
  if (!stories.length) return null
  return (
    <section aria-labelledby="briefing-title" className="glass-card p-6 sm:p-7">
      <p className="eyebrow mb-1">{t('home.briefing')}</p>
      <h2 id="briefing-title" className="type-small mb-5 text-muted-foreground">{t('home.briefingSubtitle')}</h2>
      <ol className="space-y-5">
        {stories.map((raw, i) => {
          const { story } = getStoryInLocale(raw, locale)
          return (
            <li key={story.id} className="flex gap-4">
              <span className="font-heading text-xl font-semibold leading-none text-primary/70">{i + 1}</span>
              <Link to={`/story/${story.id}`} className="group min-w-0">
                <CategoryChip category={story.category} />
                <p className="mt-1 font-heading text-[1.05rem] font-semibold leading-snug group-hover:text-primary/90">{getHeadline(story)}</p>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
