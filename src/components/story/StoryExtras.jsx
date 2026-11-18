import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellRing } from 'lucide-react'
import NewsRow from '@/components/front/NewsRow'
import { useI18n } from '@/lib/i18n/I18nContext'
import { useNews } from '@/lib/news/useNews'
import { useFollowing } from '@/lib/follow'
import { haptic } from '@/lib/haptics'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

/** «Lo que hay que saber»: los tres datos más sólidos de la historia, arriba del todo. */
export function KnowBox({ story }) {
  const { t } = useI18n()
  const points = (story.key_points || []).slice(0, 3)
  if (!points.length) return null
  return (
    <section className="mt-5 border-y-[3px] border-double border-foreground py-3">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.22em]">{t('story.mustKnow')}</h2>
      <ol className="mt-2 space-y-2">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2.5 font-serif-text text-[15.5px] leading-snug">
            <span className="font-display text-[18px] font-bold leading-none">{i + 1}</span>
            <span>{p}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Aviso de historia viva: cuándo se actualizó por última vez y en qué versión va. */
export function UpdatedLine({ story }) {
  const { t, locale } = useI18n()
  if ((story.version || 1) < 2) return null
  return (
    <a href="#timeline" className="mt-3 inline-flex items-center gap-2 text-[12.5px] font-semibold text-destructive">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
      {t('story.updatedAgo', { time: formatRelativeTime(story.updated_date, locale), n: story.version })}
    </a>
  )
}

/** Botón para seguir la historia (aparece en la portada cuando cambie). */
export function FollowButton({ story }) {
  const { t } = useI18n()
  const { isFollowing, toggle } = useFollowing()
  const on = isFollowing(story.id)
  return (
    <button
      type="button"
      onClick={() => {
        haptic('medium')
        toggle(story)
      }}
      className={cn('inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium', on ? 'border-foreground bg-foreground text-background' : 'border-foreground/40 text-foreground/80')}
    >
      {on ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {on ? t('story.following') : t('story.follow')}
    </button>
  )
}

/** Cómo titula cada periódico la misma historia (solo los titulares en el idioma del lector). */
export function HeadlinesCompare({ story, sources = [] }) {
  const { t } = useI18n()
  const lang = story.display_locale || story.content_language
  const rows = []
  const seen = new Set()
  for (const s of sources) {
    if (!s.title || seen.has(s.source_name) || (s.language && s.language !== lang)) continue
    seen.add(s.source_name)
    rows.push(s)
  }
  if (rows.length < 2) return null
  return (
    <section id="headlines">
      <h2 className="border-t-[3px] border-foreground pt-1.5 text-[12px] font-bold uppercase tracking-[0.2em]">{t('story.howTheyTellIt')}</h2>
      <ul className="divide-y divide-foreground/25">
        {rows.slice(0, 8).map((s) => (
          <li key={s.id || s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="block py-3 active:opacity-60">
              <span className="kicker">{s.source_name}</span>
              <span className="mt-0.5 block font-display text-[17px] font-bold leading-snug">«{s.title}»</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

const tokens = (s) => new Set([...(s.keywords || []), ...(s.entities || [])].map((x) => String(x).toLowerCase()))

/** Noticias relacionadas: comparten temas, personas o lugares con esta. */
export function RelatedStories({ story }) {
  const { t } = useI18n()
  const { stories } = useNews()
  const related = useMemo(() => {
    const mine = tokens(story)
    const countries = new Set(story.countries || [])
    return stories
      .filter((s) => s.id !== story.id)
      .map((s) => {
        let score = 0
        for (const k of tokens(s)) if (mine.has(k)) score += 2
        for (const c of s.countries || []) if (countries.has(c)) score += 1
        if (s.category === story.category) score += 1
        return { s, score }
      })
      .filter((x) => x.score >= 4)
      .sort((a, b) => b.score - a.score || (b.s.renivya_score ?? 0) - (a.s.renivya_score ?? 0))
      .slice(0, 4)
      .map((x) => x.s)
  }, [stories, story])
  if (!related.length) return null
  return (
    <section>
      <h2 className="border-t-[3px] border-foreground pt-1.5 text-[12px] font-bold uppercase tracking-[0.2em]">{t('story.relatedNews')}</h2>
      <div className="divide-y divide-foreground">
        {related.map((s) => (
          <NewsRow key={s.id} story={s} summary={false} />
        ))}
      </div>
    </section>
  )
}

/** Portada: historias que sigues con novedades desde la última vez que las abriste. */
export function FollowedUpdates() {
  const { t } = useI18n()
  const { stories } = useNews()
  const { map, hasNews } = useFollowing()
  const updated = stories.filter((s) => map[s.id] && hasNews(s))
  if (!updated.length) return null
  return (
    <section className="safe-x">
      <div className="rule-thick" />
      <h2 className="flex items-center gap-2 py-1.5 text-[13px] font-bold uppercase tracking-[0.2em]">
        <span className="h-2 w-2 rounded-full bg-destructive" /> {t('home.followedUpdates')}
      </h2>
      <ul className="divide-y divide-foreground/30 border-t border-foreground">
        {updated.slice(0, 5).map((s) => (
          <li key={s.id}>
            <Link to={`/story/${s.id}`} className="block py-2.5 active:opacity-60">
              <span className="kicker !text-destructive">{t('story.updatedShort')}</span>
              <span className="block font-display text-[16.5px] font-bold leading-tight">{s.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
