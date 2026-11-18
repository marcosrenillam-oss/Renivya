import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Languages, Share2 } from 'lucide-react'
import CategoryChip from '@/components/story/CategoryChip'
import CountryFlags from '@/components/story/CountryFlags'
import EditorialStory from '@/components/story/EditorialStory'
import FeedError from '@/components/story/FeedError'
import Headline from '@/components/story/Headline'
import SaveButton from '@/components/story/SaveButton'
import SourceRow from '@/components/story/SourceRow'
import StoryBreakdown from '@/components/story/StoryBreakdown'
import StoryCard from '@/components/story/StoryCard'
import StoryImage from '@/components/story/StoryImage'
import StorySection from '@/components/story/StorySection'
import StoryStateBadge from '@/components/story/StoryStateBadge'
import StoryTimeline from '@/components/story/StoryTimeline'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import {
  getStory, getStoriesByIds, listStoryMedia, listStorySources, listStoryUpdates, queryKeys,
} from '@/lib/dataService'
import { formatDateTime, readingMinutes } from '@/lib/format'
import { getStoryImage } from '@/lib/storyImage'
import { getLanguageName } from '@/lib/languages'
import { contentLanguage, storyInLocale } from '../../engine/translation.js'
import { useI18n } from '@/lib/i18n/I18nContext'

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto max-w-3xl space-y-5 pt-6">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton h-12 w-full" />
      <div className="skeleton h-12 w-3/4" />
      <div className="skeleton h-5 w-full" />
      <div className="skeleton h-5 w-5/6" />
      <div className="skeleton mt-8 h-40 w-full rounded-2xl" />
    </div>
  )
}

export default function StoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, locale } = useI18n()

  const storyQ = useQuery({ queryKey: queryKeys.story(id), queryFn: () => getStory(id), retry: false })
  const sourcesQ = useQuery({ queryKey: queryKeys.storySources(id), queryFn: () => listStorySources(id), enabled: storyQ.isSuccess })
  const updatesQ = useQuery({ queryKey: queryKeys.storyUpdates(id), queryFn: () => listStoryUpdates(id), enabled: storyQ.isSuccess })
  const mediaQ = useQuery({ queryKey: queryKeys.storyMedia(id), queryFn: () => listStoryMedia(id), enabled: storyQ.isSuccess })
  const relatedIds = storyQ.data?.related_stories || []
  const relatedQ = useQuery({ queryKey: ['story', id, 'related', relatedIds], queryFn: () => getStoriesByIds(relatedIds), enabled: relatedIds.length > 0 })

  if (storyQ.isLoading) return <DetailSkeleton />
  if (storyQ.isError) {
    const notFound = (storyQ.error?.status ?? storyQ.error?.response?.status) === 404
    return (
      <div className="mx-auto max-w-xl pt-10">
        {notFound ? (
          <div className="glass-card p-10 text-center">
            <p className="type-h2 mb-5">{t('story.notFound')}</p>
            <Button variant="outline" asChild><Link to="/">{t('notFound.home')}</Link></Button>
          </div>
        ) : (
          <FeedError onRetry={storyQ.refetch} />
        )}
      </div>
    )
  }

  // La historia se lee entera en el idioma del lector (original o traducción completa), nunca mezclada.
  const story = storyInLocale(storyQ.data, locale)
  if (!story) {
    return (
      <div className="mx-auto max-w-xl pt-10">
        <div className="glass-card p-10 text-center">
          <p className="type-h2 mb-5">{t('story.notAvailable')}</p>
          <Button variant="outline" asChild><Link to="/">{t('notFound.home')}</Link></Button>
        </div>
      </div>
    )
  }
  const isTranslated = story.is_translated
  const original = contentLanguage(storyQ.data)
  const image = getStoryImage(story, mediaQ.data || [])
  const minutes = readingMinutes(story.summary, story.body)

  async function onShare() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: story.title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast({ title: t('story.linkCopied') })
      }
    } catch {
      /* el usuario canceló */
    }
  }

  return (
    <article className="mx-auto max-w-6xl">
      <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="type-small mb-8 inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('story.back')}
      </button>

      <header className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <CategoryChip category={story.category} link size="md" />
          <StoryStateBadge story={story} />
          {story.version > 1 && <span className="type-caption text-muted-foreground">{t('story.version', { n: story.version })}</span>}
        </div>
        <Headline story={story} size="display" as="h1" />
        <p className="mt-6 font-heading text-[1.3rem] leading-[1.55] text-text-secondary">{story.summary}</p>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y py-4">
          <div className="type-caption flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <time dateTime={story.published_at}>{formatDateTime(story.published_at, locale)}</time>
            <span aria-hidden="true">·</span>
            <span>{t('story.readingTime', { min: minutes })}</span>
            <span aria-hidden="true">·</span>
            <span>{story.source_count === 1 ? t('story.sourcesOne') : t('story.sources', { count: story.source_count })}</span>
            {(story.countries || []).length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <CountryFlags countries={story.countries} max={4} withNames />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SaveButton storyId={story.id} withLabel />
            <button onClick={onShare} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {t('story.share')}
            </button>
          </div>
        </div>

        {isTranslated && (
          <div className="type-small mt-4 flex flex-wrap items-center gap-3 text-muted-foreground">
            <Languages className="h-4 w-4" aria-hidden="true" />
            <span>{t('story.translated', { language: getLanguageName(original, locale).toLowerCase() })}</span>
          </div>
        )}
        {story.insufficient_info && <p className="type-small mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-muted-foreground">{t('story.insufficient')}</p>}
        {story.has_corrections && (
          <p className="type-small mt-4 rounded-xl border p-3 text-muted-foreground">
            <strong className="text-foreground">{t('story.correction')}</strong>
          </p>
        )}
      </header>

      {image && (
        <figure className="mx-auto mt-10 max-w-4xl">
          <StoryImage story={story} media={mediaQ.data || []} eager className="aspect-[16/9] rounded-2xl" />
          {(image.credit || image.sourceName) && (
            <figcaption className="type-caption mt-2 text-muted-foreground">{t('story.imageCredit', { credit: image.credit || image.sourceName })}</figcaption>
          )}
        </figure>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
        <div className="mx-auto w-full max-w-3xl space-y-14">
          <EditorialStory story={story} />

          {((story.timeline || []).length > 0 || (updatesQ.data || []).length > 0) && (
            <StorySection id="timeline" title={(story.timeline || []).length ? t('story.timeline') : t('story.history')}>
              <StoryTimeline events={story.timeline} updates={updatesQ.data || []} />
            </StorySection>
          )}

          {(sourcesQ.data || []).length > 0 && (
            <StorySection id="sources" title={t('story.sourceList')}>
              <ul className="divide-y">
                {sourcesQ.data.map((s) => (
                  <SourceRow key={s.id} source={s} />
                ))}
              </ul>
            </StorySection>
          )}
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <StoryBreakdown story={story} />
          {(relatedQ.data || []).length > 0 && (
            <div>
              <p className="eyebrow mb-1">{t('story.related')}</p>
              <div className="divide-y">
                {relatedQ.data.map((s) => storyInLocale(s, locale)).filter(Boolean).map((s) => (
                  <StoryCard key={s.id} story={s} variant="compact" />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
