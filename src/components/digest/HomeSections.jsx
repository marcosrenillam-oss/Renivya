import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import StoryCard from '@/components/story/StoryCard'
import DigestStoryCard from '@/components/digest/DigestStoryCard'
import CategoryChip from '@/components/story/CategoryChip'
import { getCountryFlag, getCountryName } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/I18nContext'

function SectionTitle({ children, to, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b pb-3">
      <h2 className="eyebrow text-foreground">{children}</h2>
      {to && (
        <Link to={to} className="type-caption inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          {action}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

export function HomeTop({ stories }) {
  const { t } = useI18n()
  if (!stories.length) return null
  return (
    <section>
      <SectionTitle to="/top-stories" action={t('home.seeAll')}>{t('home.top')}</SectionTitle>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((s, i) => (
          <DigestStoryCard key={s.id} story={s} index={i} />
        ))}
      </div>
    </section>
  )
}

export function HomePrimaryCountry({ code, stories }) {
  const { t, locale } = useI18n()
  if (!stories.length) return null
  return (
    <section>
      <SectionTitle to={`/world?country=${code}`} action={t('home.seeAll')}>
        <span className="mr-1.5" aria-hidden="true">{getCountryFlag(code)}</span>
        {t('home.primaryCountry', { country: getCountryName(code, locale) })}
      </SectionTitle>
      <div className="grid gap-x-8 sm:grid-cols-2">
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} variant="compact" className="border-b last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0" />
        ))}
      </div>
    </section>
  )
}

export function HomeByCategory({ sections }) {
  const { t } = useI18n()
  if (!sections.length) return null
  return (
    <section>
      <SectionTitle>{t('home.byCategory')}</SectionTitle>
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ category, stories }) => (
          <div key={category}>
            <CategoryChip category={category} link size="md" />
            <div className="mt-1 divide-y">
              {stories.map((s) => (
                <StoryCard key={s.id} story={s} variant="compact" hideCategory />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
