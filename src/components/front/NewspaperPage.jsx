import moment from 'moment'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { getCountryName } from '@/lib/countries'
import { getStoryImage } from '@/lib/storyImage'
import { sourcesLabel } from '@/components/front/storyText'
import { cn } from '@/lib/utils'

/**
 * Primera plana de periódico de época: cabecera gótica, titular, la foto de la noticia
 * (en blanco y negro; a color cuando está en el centro), columnas y "Además".
 */
export default function NewspaperPage({ story, edition, others = [], active = false }) {
  const { t, locale } = useI18n()
  const [imgOk, setImgOk] = useState(true)
  const img = getStoryImage(story)
  const date = moment(story.published_at).locale(locale)
  const issue = moment().dayOfYear() + 1000 * (moment().year() - 2025)
  const text = [story.summary, ...(story.body || [])].filter(Boolean).join(' ')
  const ink = '#16130f'
  const photoFilter = active ? 'grayscale(0.05) contrast(1.05) saturate(1.05)' : 'grayscale(1) contrast(1.15) sepia(0.2)'

  return (
    <article
      className="newsprint relative flex h-full w-full flex-col overflow-hidden rounded-[6px] px-4 pb-3 pt-3 text-left"
      style={{ color: ink, boxShadow: '0 40px 60px -30px rgba(0,0,0,0.6), 0 12px 24px -12px rgba(0,0,0,0.35), inset 0 0 40px rgba(120,90,40,0.18)' }}
    >
      <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] opacity-70">
        <span>{t('home.edition', { country: getCountryName(edition, locale) })}</span>
        <span>{t('home.number', { n: issue })}</span>
      </div>
      <h3 className="font-masthead mt-0.5 text-center text-[42px] leading-[1.02]">Renivya</h3>
      <div className="border-y-[1.5px] py-[2px]" style={{ borderColor: ink }}>
        <div className="flex items-center justify-between border-y px-0.5 py-[3px] text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: `${ink}66` }}>
          <span className="truncate">{date.format(locale === 'es' ? 'D [de] MMMM, YYYY' : 'MMMM D, YYYY')}</span>
          {story.is_breaking ? <span className="ml-2 shrink-0 text-[#a3121f]">{t('home.breaking')}</span> : <span className="ml-2 truncate">{getCategoryLabel(story.category, t)}</span>}
        </div>
      </div>

      <h2 className="mt-2.5 line-clamp-3 font-display text-[25px] font-black leading-[1.02] tracking-[-0.015em]">{story.title}</h2>

      {img && imgOk && (
        <figure className="mt-2.5">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2px] bg-[#d9cfba] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]">
            <img
              src={img.url}
              alt={img.alt}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImgOk(false)}
              className="h-full w-full object-cover [transition:filter_1.2s_ease-out,transform_1.2s_ease-out]"
              style={{ filter: photoFilter, transform: active ? 'scale(1.06)' : 'scale(1)' }}
            />
          </div>
          {img.credit && <figcaption className="mt-1 truncate text-[8.5px] italic opacity-60">{img.credit}</figcaption>}
        </figure>
      )}

      <div className="relative mt-2.5 min-h-0 flex-1 overflow-hidden">
        <p className="font-serif-text columns-2 gap-3 text-justify text-[11px] leading-[1.42] [hyphens:auto] first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-[32px] first-letter:font-black first-letter:leading-[0.8]" lang={locale}>
          {text}
        </p>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12" style={{ background: 'linear-gradient(to bottom, transparent, #ece4d2)' }} />
      </div>

      {others.length > 0 && (
        <div className="mt-1.5 border-t-[1.5px] pt-1.5" style={{ borderColor: ink }}>
          <p className="text-[8.5px] font-bold uppercase tracking-[0.16em] opacity-70">{t('home.alsoToday')}</p>
          <div className="mt-1 grid grid-cols-2 gap-3">
            {others.slice(0, 2).map((o, i) => (
              <p key={o.id} className={cn('line-clamp-2 font-display text-[12px] font-bold leading-[1.15]', i && 'border-l pl-3')} style={{ borderColor: `${ink}44` }}>
                {o.title}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between border-t pt-1.5 text-[9.5px] font-medium opacity-75" style={{ borderColor: `${ink}55` }}>
        <span className="truncate">{t('home.according', { sources: sourcesLabel(story, t) })}</span>
        <span className="ml-2 shrink-0">1</span>
      </div>

      {/* Pliegue del papel y brillo que lo recorre */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.07) 48%, rgba(255,255,255,0.18) 52%, transparent)' }} />
      <div aria-hidden="true" className="paper-sheen" />
    </article>
  )
}
