import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, Languages, Share2 } from 'lucide-react'
import CategoryChip from '@/components/story/CategoryChip'
import CountryFlags from '@/components/story/CountryFlags'
import EditorialStory from '@/components/story/EditorialStory'
import FeedError from '@/components/story/FeedError'
import { getHeadline as getHeadlineText } from '@/lib/headline'
import SaveButton from '@/components/story/SaveButton'
import SourceRow from '@/components/story/SourceRow'
import StoryBreakdown from '@/components/story/StoryBreakdown'
import { StoryPhoto } from '@/components/front/NewsRow'
import StorySection from '@/components/story/StorySection'
import StoryStateBadge from '@/components/story/StoryStateBadge'
import StoryTimeline from '@/components/story/StoryTimeline'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import {
  getStory, listStoryMedia, listStorySources, listStoryUpdates, queryKeys,
} from '@/lib/dataService'
import { formatDateTime, readingMinutes } from '@/lib/format'
import { getStoryImage } from '@/lib/storyImage'
import { FollowButton, HeadlinesCompare, KnowBox, RelatedStories, UpdatedLine } from '@/components/story/StoryExtras'
import { useFollowing } from '@/lib/follow'
import { useEffect } from 'react'
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
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, -30])

  const storyQ = useQuery({ queryKey: queryKeys.story(id), queryFn: () => getStory(id), retry: false })
  const { markSeen } = useFollowing()
  useEffect(() => {
    if (storyQ.data) markSeen(storyQ.data)
  }, [storyQ.data, markSeen])
  const sourcesQ = useQuery({ queryKey: queryKeys.storySources(id), queryFn: () => listStorySources(id), enabled: storyQ.isSuccess })
  const updatesQ = useQuery({ queryKey: queryKeys.storyUpdates(id), queryFn: () => listStoryUpdates(id), enabled: storyQ.isSuccess })
  const mediaQ = useQuery({ queryKey: queryKeys.storyMedia(id), queryFn: () => listStoryMedia(id), enabled: storyQ.isSuccess })

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
    <article className="relative mx-auto max-w-6xl">
      <header className="safe-x mx-auto max-w-3xl pt-2">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t('story.back')}
        </button>
        <div className="rule-thick" />
        <div className="flex flex-wrap items-center gap-2 py-1.5">
          <CategoryChip category={story.category} className="!text-foreground" />
          <StoryStateBadge story={story} />
        </div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="border-t border-foreground pt-3 font-display text-[34px] font-black leading-[1.05] tracking-[-0.015em]">
          {getHeadlineText(story)}
        </motion.h1>
        <p className="mt-3 font-serif-text text-[1.2rem] italic leading-[1.5] text-foreground/85">{story.summary}</p>
        <UpdatedLine story={story} />
        {story.image_url && (
          <figure className="mt-5 overflow-hidden">
            <motion.div style={{ y: heroY }} className="overflow-hidden">
              <StoryPhoto story={story} eager transition className="aspect-[3/2] w-full object-cover [filter:grayscale(0.1)_contrast(1.05)]" />
            </motion.div>
            {(image?.credit || image?.sourceName) && <figcaption className="mt-1.5 border-b border-foreground/30 pb-1.5 text-[11px] italic text-muted-foreground">{t('story.imageCredit', { credit: image.credit || image.sourceName })}</figcaption>}
          </figure>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-foreground py-2.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-muted-foreground">
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
            <FollowButton story={story} />
            <button onClick={onShare} className="inline-flex items-center gap-1.5 border border-foreground/40 px-3 py-1.5 text-xs font-medium text-foreground/80">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {t('story.share')}
            </button>
          </div>
        </div>

        <KnowBox story={story} />

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

      <div className="safe-x mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
        <div className="mx-auto w-full max-w-3xl space-y-14">
          <EditorialStory story={story} hideKeyPoints />

          <HeadlinesCompare story={story} sources={sourcesQ.data || []} />

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
          <RelatedStories story={story} />
        </aside>
      </div>
    </article>
  )
}
