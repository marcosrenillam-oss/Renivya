import { AlertCircle, CheckCircle2, CircleDashed, HelpCircle, Info } from 'lucide-react'
import StorySection from '@/components/story/StorySection'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const FACT_STYLE = {
  confirmed: { icon: CheckCircle2, tone: 'text-success' },
  reported: { icon: CircleDashed, tone: 'text-accent' },
  unconfirmed: { icon: HelpCircle, tone: 'text-warning' },
  context: { icon: Info, tone: 'text-muted-foreground' },
}

function SourcesCaption({ sources }) {
  if (!sources?.length) return null
  return (
    <p className="type-caption mt-2 text-muted-foreground/80">
      {sources.map((s) => s?.name).filter(Boolean).join(' · ')}
    </p>
  )
}

/** Pieza editorial completa con trazabilidad por párrafo, hechos y contraste entre fuentes. */
export default function EditorialStory({ story }) {
  const { t } = useI18n()
  const prov = story.provenance || {}
  const contrast = story.contrast || {}
  const hasContrast = ['coincidencias', 'diferencias', 'ausencias', 'unconfirmed'].some((k) => (contrast[k] || []).length)

  return (
    <div className="space-y-12">
      {(story.key_points || []).length > 0 && (
        <StorySection id="key-points" title={t('story.keyPoints')}>
          <ul className="space-y-3 rounded-2xl border bg-card/60 p-5 sm:p-6">
            {story.key_points.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span className="type-body">{point}</span>
              </li>
            ))}
          </ul>
        </StorySection>
      )}

      {(story.body || []).length > 0 && (
        <div className="space-y-6">
          {story.body.map((paragraph, i) => (
            <div key={i}>
              <p className="font-heading text-[1.17rem] leading-[1.7] text-foreground/90">{paragraph}</p>
              <SourcesCaption sources={prov.body?.[i]} />
            </div>
          ))}
        </div>
      )}

      {story.why_it_matters && (
        <StorySection id="why" title={t('story.whyItMatters')}>
          <p className="type-body border-l-2 border-primary pl-4 text-[1.02rem]">{story.why_it_matters}</p>
        </StorySection>
      )}

      {story.context && (
        <StorySection id="context" title={t('story.context')}>
          <p className="type-body text-muted-foreground">{story.context}</p>
        </StorySection>
      )}

      {(story.known_facts || []).length > 0 && (
        <StorySection id="facts" title={t('story.whatWeKnow')}>
          <ul className="divide-y rounded-2xl border bg-card/40">
            {story.known_facts.slice(0, 8).map((fact, i) => {
              const style = FACT_STYLE[fact.status] || FACT_STYLE.reported
              const Icon = style.icon
              return (
                <li key={i} className="flex gap-3 p-4">
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', style.tone)} aria-hidden="true" />
                  <div className="min-w-0">
                    <span className={cn('type-caption font-semibold uppercase tracking-wider', style.tone)}>{t(`fact.${fact.status}`)}</span>
                    <p className="type-small mt-0.5">{fact.text}</p>
                    <SourcesCaption sources={fact.sources} />
                  </div>
                </li>
              )
            })}
          </ul>
        </StorySection>
      )}

      {hasContrast && (
        <StorySection id="contrast" title={t('story.contrast')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <ContrastBlock title={t('story.agree')} items={contrast.coincidencias} tone="success" />
            <ContrastBlock title={t('story.differ')} items={contrast.diferencias} tone="warning" />
            <ContrastBlock title={t('story.onlyOne')} items={contrast.ausencias} tone="accent" />
            <ContrastBlock title={t('story.unconfirmed')} items={contrast.unconfirmed} tone="destructive" />
          </div>
          <p className="type-caption mt-4 flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {t('story.primarySource')}: {contrast.primary_source?.found ? contrast.primary_source.description : t('story.noPrimarySource')}
          </p>
        </StorySection>
      )}
    </div>
  )
}

function ContrastBlock({ title, items = [], tone }) {
  if (!items?.length) return null
  const dot = { success: 'bg-success', warning: 'bg-warning', accent: 'bg-accent', destructive: 'bg-destructive' }[tone]
  return (
    <div className="rounded-2xl border bg-card/40 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className={cn('h-2 w-2 rounded-full', dot)} aria-hidden="true" />
        {title}
      </p>
      <ul className="space-y-2">
        {items.slice(0, 4).map((item, i) => (
          <li key={i} className="type-small text-muted-foreground">{item}</li>
        ))}
      </ul>
    </div>
  )
}
