import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ConfidenceIndicator from '@/components/story/ConfidenceIndicator'
import ScoreBadge from '@/components/story/ScoreBadge'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const SCORE_KEYS = ['impact', 'reach', 'international', 'magnitude', 'development_potential', 'audience_relevance', 'recency', 'confidence_context']

function Bar({ label, value }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <span className="type-caption text-muted-foreground">{label}</span>
      <span className="type-caption tabular-nums text-muted-foreground">{Math.round(value ?? 0)}</span>
      <div className="col-span-2 h-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(2, value ?? 0)}%` }} />
      </div>
    </div>
  )
}

/** "Cómo lo medimos": relevancia y solidez, separadas y explicables. */
export default function StoryBreakdown({ story }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const cb = story.confidence_breakdown || {}
  const rows = [
    [t('breakdown.independent_sources'), cb.independent_sources ?? story.independent_sources ?? '—'],
    [t('breakdown.agreement_ratio'), cb.agreement_ratio != null ? `${cb.agreement_ratio}%` : '—'],
    [t('breakdown.contradictions'), cb.contradiction_count ?? 0],
    [t('breakdown.confirmed_facts'), cb.confirmed_facts ?? 0],
    [t('breakdown.unconfirmed_facts'), cb.unconfirmed_facts ?? 0],
    [t('breakdown.primary_source'), cb.primary_source_present ? t('breakdown.yes') : t('breakdown.no')],
  ]
  return (
    <div className="glass-card p-5">
      <p className="eyebrow mb-1">{t('story.howWeMeasure')}</p>
      <p className="type-caption mb-5 text-muted-foreground">{t('story.howWeMeasureBody')}</p>
      <div className="space-y-5">
        <ScoreBadge score={story.renivya_score ?? story.score} label={t('story.relevance')} />
        <div>
          <p className="type-caption mb-2 text-muted-foreground">{t('story.solidity')}</p>
          <ConfidenceIndicator status={story.confidence_status} value={story.confidence} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="type-caption mt-5 inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        {open ? t('story.hideBreakdown') : t('story.showBreakdown')}
      </button>
      {open && (
        <div className="mt-4 space-y-5 border-t pt-4">
          <div className="space-y-2.5">
            {SCORE_KEYS.map((k) => (
              <Bar key={k} label={t(`breakdown.${k}`)} value={story.score_breakdown?.[k]} />
            ))}
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 border-t pt-4">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="type-caption text-muted-foreground">{label}</dt>
                <dd className="type-caption text-right font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
