import { Link } from 'react-router-dom'
import { useNews } from '@/lib/news/useNews'
import { useTopics } from '@/lib/preferences'
import { newForTopic } from '@/components/search/SearchDiscovery'
import { useI18n } from '@/lib/i18n/I18nContext'

/** "Tus temas" en la portada: cada tema que sigues y cuántas noticias nuevas tiene. */
export default function TopicsStrip() {
  const { t } = useI18n()
  const { topics } = useTopics()
  const { stories } = useNews()
  if (!topics.length) return null
  return (
    <section className="safe-x">
      <div className="flex items-baseline gap-3 border-y border-foreground py-2">
        <h2 className="kicker shrink-0 text-foreground">{t('search.topics')}</h2>
        <div className="no-scrollbar flex gap-4 overflow-x-auto">
          {topics.map((topic) => {
            const fresh = newForTopic(stories, topic)
            return (
              <Link key={topic.term} to={`/search?q=${encodeURIComponent(topic.term)}`} className="shrink-0 font-display text-[16px] font-bold">
                {topic.term}
                {fresh > 0 && <sup className="ml-0.5 text-[10px] font-semibold text-destructive">{fresh}</sup>}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
