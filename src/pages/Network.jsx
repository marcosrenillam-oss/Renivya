import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Share2 } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import Spinner from '@/components/common/Spinner'
import FeedError from '@/components/story/FeedError'
import NetworkGraph from '@/components/network/NetworkGraph'
import NetworkNodePanel from '@/components/network/NetworkNodePanel'
import NetworkDetailPanel from '@/components/network/NetworkDetailPanel'
import { TYPE_GROUPS } from '@/components/network/networkStyle'
import { Button } from '@/components/ui/button'
import { loadEntityGraph } from '@/lib/news/networkService'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function Network() {
  const { t } = useI18n()
  const [selected, setSelected] = useState(null)
  const [groups, setGroups] = useState(TYPE_GROUPS.map(([k]) => k))
  const [resetKey, setResetKey] = useState(0)
  const q = useQuery({ queryKey: ['entity-graph'], queryFn: () => loadEntityGraph({ maxNodes: 70 }) })

  const graph = useMemo(() => {
    if (!q.data) return null
    const allowed = new Set(TYPE_GROUPS.filter(([k]) => groups.includes(k)).flatMap(([, types]) => types))
    const nodes = q.data.nodes.filter((n) => allowed.has(n.type) || (n.type === 'other' && groups.length === TYPE_GROUPS.length))
    const ids = new Set(nodes.map((n) => n.id))
    const edges = q.data.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
    return { nodes, edges, stats: { entities: nodes.length, relations: edges.filter((e) => e.kind === 'relation').length } }
  }, [q.data, groups])

  const node = graph?.nodes.find((n) => n.id === selected) || null
  const toggle = (k) => setGroups((g) => (g.includes(k) ? (g.length > 1 ? g.filter((x) => x !== k) : g) : [...g, k]))

  return (
    <div className="space-y-8">
      <SectionHeader as="h1" size="display" title={t('page.network.title')} description={t('network.subtitle')} />
      {q.isLoading ? (
        <Spinner label={t('common.loading')} />
      ) : q.isError ? (
        // Error y vacío son estados distintos.
        <FeedError message={t('network.error')} onRetry={q.refetch} />
      ) : !q.data.nodes.length ? (
        <div className="glass-card mx-auto max-w-md px-8 py-14 text-center">
          <Share2 className="mx-auto mb-4 h-7 w-7 text-primary/70" strokeWidth={1.5} aria-hidden="true" />
          <p className="type-h3">{t('network.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="glass-card relative overflow-hidden">
            <NetworkGraph nodes={graph.nodes} edges={graph.edges} selected={selected} onSelect={setSelected} resetKey={resetKey} className="aspect-[4/3] max-h-[72vh] min-h-[360px]" />
            <div className="absolute right-3 top-3">
              <Button size="sm" variant="outline" className="bg-card/80" onClick={() => setResetKey((k) => k + 1)}>{t('network.reset')}</Button>
            </div>
            {!node && <p className="type-caption pointer-events-none absolute bottom-3 left-4 text-muted-foreground">{t('network.select')}</p>}
          </div>
          <aside className="space-y-5">
            {node && <NetworkNodePanel node={node} nodes={graph.nodes} edges={graph.edges} onClose={() => setSelected(null)} onSelect={setSelected} />}
            <NetworkDetailPanel stats={graph.stats} activeGroups={groups} onToggleGroup={toggle} />
          </aside>
        </div>
      )}
    </div>
  )
}
