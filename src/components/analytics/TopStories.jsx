import { Link } from 'react-router-dom'
import { getHeadline } from '@/lib/headline'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Ranking con métricas visibles: solo en Analítica. */
export default function TopStories({ stories }) {
  const { t } = useI18n()
  return (
    <section className="glass-card p-5 sm:p-6">
      <h2 className="type-h3 mb-4">{t('analytics.topStories')}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="type-caption py-2 font-semibold text-muted-foreground">{t('analytics.story')}</th>
            <th className="type-caption py-2 text-right font-semibold text-muted-foreground">{t('story.relevance')}</th>
            <th className="type-caption py-2 text-right font-semibold text-muted-foreground">{t('story.solidity')}</th>
          </tr>
        </thead>
        <tbody>
          {stories.map((s) => (
            <tr key={s.id} className="border-b last:border-0">
              <td className="py-2.5 pr-3"><Link to={`/story/${s.id}`} className="font-heading font-semibold hover:text-primary">{getHeadline(s)}</Link></td>
              <td className="py-2.5 text-right tabular-nums">{s.renivya_score}</td>
              <td className="py-2.5 text-right tabular-nums">{s.confidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
