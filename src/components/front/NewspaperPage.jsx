import moment from 'moment'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { getCountryName } from '@/lib/countries'
import { getStoryImage } from '@/lib/storyImage'
import { sourcesLabel } from '@/components/front/storyText'

/** Primera plana de periódico de época para una historia: cabecera, titular, foto y columnas. */
export default function NewspaperPage({ story, edition, others = [] }) {
  const { t, locale } = useI18n()
  const [imgOk, setImgOk] = useState(true)
  const img = getStoryImage(story)
  const date = moment(story.published_at).locale(locale)
  const issue = moment().dayOfYear() + 1000 * (moment().year() - 2025)
  const text = [story.summary, ...(story.body || [])].filter(Boolean).join(' ')
  const hasPhoto = Boolean(img && imgOk)
  const ink = '#16130f'

  return (
    <article className="newsprint flex h-full w-full flex-col overflow-hidden rounded-[5px] px-4 pb-3 pt-3 text-left shadow-[0_28px_50px_-28px_rgba(0,0,0,0.55),0_2px_0_rgba(0,0,0,0.05)]" style={{ color: ink }}>
      <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] opacity-70">
        <span>{t('home.edition', { country: getCountryName(edition, locale) })}</span>
        <span>{t('home.number', { n: issue })}</span>
      </div>
      <h3 className="font-masthead mt-0.5 text-center text-[40px] leading-[1.05]">Renivya</h3>
      <div className="border-y-[1.5px] py-[2px]" style={{ borderColor: ink }}>
        <div className="flex items-center justify-between border-y px-0.5 py-[3px] text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: `${ink}66` }}>
          <span className="truncate first-letter:uppercase">{date.format(locale === 'es' ? 'D [de] MMMM, YYYY' : 'MMMM D, YYYY')}</span>
          {story.is_breaking ? <span className="text-[#a3121f]">{t('home.breaking')}</span> : <span className="ml-2 truncate">{getCategoryLabel(story.category, t)}</span>}
        </div>
      </div>

      <h2 className={`mt-3 font-display font-black leading-[1.02] tracking-[-0.015em] ${hasPhoto ? 'line-clamp-4 text-[27px]' : 'line-clamp-5 text-[31px]'}`}>{story.title}</h2>

      {img && imgOk ? (
        <figure className="mt-3">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2px] bg-[#d9cfba]">
            <img src={img.url} alt={img.alt} loading="lazy" onError={() => setImgOk(false)} className="newsprint-photo h-full w-full object-cover" />
          </div>
          {img.credit && <figcaption className="mt-1 text-[9px] italic opacity-60">{img.credit}</figcaption>}
        </figure>
      ) : null}

      <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
        <p className="font-serif-text columns-2 gap-3 text-justify text-[11.5px] leading-[1.42] [hyphens:auto] first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-[34px] first-letter:font-black first-letter:leading-[0.8]" lang={locale}>
          {text}
        </p>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14" style={{ background: 'linear-gradient(to bottom, transparent, #ece4d2)' }} />
      </div>

      {others.length > 0 && (
        <div className="mt-2 border-t-[1.5px] pt-1.5" style={{ borderColor: ink }}>
          <p className="text-[8.5px] font-bold uppercase tracking-[0.16em] opacity-70">{t('home.alsoToday')}</p>
          <div className="mt-1 grid grid-cols-2 gap-3">
            {others.slice(0, 2).map((o, i) => (
              <p key={o.id} className={`line-clamp-3 font-display text-[12.5px] font-bold leading-[1.15] ${i ? 'border-l pl-3' : ''}`} style={{ borderColor: `${ink}44` }}>
                {o.title}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t pt-1.5 text-[9.5px] font-medium opacity-75" style={{ borderColor: `${ink}55` }}>
        <span className="truncate">{t('home.according', { sources: sourcesLabel(story, t) })}</span>
        <span className="ml-2 shrink-0">1</span>
      </div>
    </article>
  )
}
