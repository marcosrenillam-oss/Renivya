import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import StoryCard from '@/components/story/StoryCard'
import { getStoriesByIds } from '@/lib/dataService'
import { useI18n } from '@/lib/i18n/I18nContext'
import { TYPE_COLOR } from '@/components/network/networkStyle'

/** Detalle de una entidad: tipo, conexiones (con el tipo de relación si es explícita) e historias. */
export default function NetworkNodePanel({ node, nodes, edges, onClose, onSelect }) {
  const { t } = useI18n()
  const stories = useQuery({ queryKey: ['network-node', node.id, node.stories], queryFn: () => getStoriesByIds(node.stories.slice(0, 8)) })
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const connections = edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => ({ other: byId.get(e.source === node.id ? e.target : e.source), e, outgoing: e.source === node.id }))
    .filter((c) => c.other)
    .sort((a, b) => (b.e.kind === 'relation') - (a.e.kind === 'relation') || b.e.weight - a.e.weight)
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[node.type] || TYPE_COLOR.other }} aria-hidden="true" />
            {t(`entityType.${node.type}`)}
          </p>
          <h2 className="type-h1">{node.name}</h2>
        </div>
        <button onClick={onClose} aria-label={t('common.close')} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
      </div>
      {connections.length > 0 && (
        <div className="mb-5">
          <p className="eyebrow mb-2">{t('network.connections')}</p>
          <ul className="space-y-1.5">
            {connections.slice(0, 10).map(({ other, e, outgoing }) => (
              <li key={`${other.id}-${e.kind}-${e.relation_type || ''}`}>
                <button onClick={() => onSelect(other.id)} className="type-small text-left hover:text-primary">
                  {e.kind === 'relation' ? (
                    outgoing ? <>{node.name} <em className="text-accent">{t(`relation.${e.relation_type}`)}</em> <strong>{other.name}</strong></> : <><strong>{other.name}</strong> <em className="text-accent">{t(`relation.${e.relation_type}`)}</em> {node.name}</>
                  ) : (
                    <><strong>{other.name}</strong> <span className="text-muted-foreground">· {e.weight}</span></>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="eyebrow mb-1">{t('network.storiesWith')}</p>
      <div className="divide-y">
        {(stories.data || []).map((s) => <StoryCard key={s.id} story={s} variant="compact" />)}
      </div>
    </div>
  )
}
