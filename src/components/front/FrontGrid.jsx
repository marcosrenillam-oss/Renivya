import { Link } from 'react-router-dom'
import FeatureCard from '@/components/front/FeatureCard'
import NewsRow, { StoryPhoto } from '@/components/front/NewsRow'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { formatRelativeTime } from '@/lib/format'
import { getStoryImage } from '@/lib/storyImage'
import { openStory } from '@/lib/storyTransition'
import { sourceNames } from '@/components/front/storyText'
import { useNavigate } from 'react-router-dom'

/** Media columna: foto arriba, sección y titular (para las parejas a dos columnas). */
function HalfCard({ story }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  return (
    <Link to={`/story/${story.id}`} onClick={(e) => openStory(e, navigate, story.id)} className="block py-4 active:opacity-70">
      <StoryPhoto story={story} className="mb-2 aspect-[4/3] w-full object-cover" />
      <p className={story.is_breaking ? 'kicker !text-destructive' : 'kicker'}>{story.is_breaking ? t('home.breaking') : getCategoryLabel(story.category, t)}</p>
      <h3 className="mt-0.5 font-display text-[17px] font-bold leading-[1.15]">{story.title}</h3>
      <p className="mt-1 text-[11px] italic text-muted-foreground">{sourceNames(story)[0]}</p>
    </Link>
  )
}

/** «En breve»: tres titulares de solo texto en un recuadro de rayas. */
function Briefs({ stories }) {
  const { t } = useI18n()
  return (
    <div className="my-4 border-y-[3px] border-double border-foreground py-2">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.24em]">{t('home.briefs')}</p>
      <ul className="mt-1 divide-y divide-foreground/30">
        {stories.map((s) => (
          <li key={s.id}>
            <Link to={`/story/${s.id}`} className="flex items-baseline gap-2 py-2 active:opacity-60">
              <span className="text-[9px]">■</span>
              <span className="flex-1">
                <span className="font-display text-[15.5px] font-bold leading-tight">{s.title}</span>
                <span className="ml-1.5 whitespace-nowrap text-[11px] italic text-muted-foreground">{formatRelativeTime(s.updated_date || s.published_at)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Resto de la portada maquetado como un periódico: se alternan una gran noticia a todo el
 * ancho, una pareja a dos columnas, un recuadro de breves y columnas normales.
 */
export default function FrontGrid({ stories }) {
  const blocks = []
  const queue = [...stories]
  const take = (pred) => {
    const i = queue.findIndex(pred)
    return i === -1 ? null : queue.splice(i, 1)[0]
  }
  const hasPhoto = (s) => Boolean(getStoryImage(s))
  let step = 0
  while (queue.length) {
    const kind = step % 4
    if (kind === 0) {
      const s = take(hasPhoto) || queue.shift()
      blocks.push(<div key={`f${s.id}`} className="border-t border-foreground"><FeatureCard story={s} /></div>)
    } else if (kind === 1 && queue.filter(hasPhoto).length >= 2) {
      const a = take(hasPhoto)
      const b = take(hasPhoto)
      blocks.push(
        <div key={`p${a.id}`} className="grid grid-cols-2 border-t border-foreground">
          <div className="pr-3">
            <HalfCard story={a} />
          </div>
          <div className="border-l border-foreground/40 pl-3">
            <HalfCard story={b} />
          </div>
        </div>
      )
    } else if (kind === 2 && queue.length >= 3) {
      blocks.push(<Briefs key={`b${queue[0].id}`} stories={queue.splice(0, 3)} />)
    } else {
      for (const s of queue.splice(0, 3)) blocks.push(<div key={`r${s.id}`} className="border-t border-foreground"><NewsRow story={s} /></div>)
    }
    step++
  }
  return <div>{blocks}</div>
}
