import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Play, XCircle } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { client } from '@/api/client'
import { getSnapshotMeta, syncSnapshot } from '@/lib/snapshotSync'
import { formatDateTime } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const INVENTORY = ['Story', 'NewsItem', 'Source', 'StorySource', 'StoryUpdate', 'Entity', 'StoryEntity', 'EntityRelation', 'Media', 'ArticleEmbedding']

async function loadInventory() {
  const out = {}
  for (const name of INVENTORY) {
    const h = client.entities[name]
    out[name] = typeof h.count === 'function' ? await h.count({}) : (await h.list(undefined, 5000)).length
  }
  const pending = typeof client.entities.NewsItem.count === 'function' ? await client.entities.NewsItem.count({ status: 'pending' }) : (await client.entities.NewsItem.filter({ status: 'pending' }, undefined, 5000)).length
  return { counts: out, pending }
}

function Card({ title, hint, children }) {
  return (
    <section className="glass-card space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="type-h2">{title}</h2>
        {hint && <p className="type-small mt-1 text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function ResultList({ rows }) {
  if (!rows?.length) return null
  return (
    <ul className="divide-y rounded-xl border">
      {rows.map((r, i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-2.5">
          {r.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="OK" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-label="Fallo" />}
          <div className="min-w-0">
            <p className="text-sm font-medium">{r.name}</p>
            {r.detail != null && r.detail !== '' && <p className="type-caption break-words text-muted-foreground">{String(r.detail)}</p>}
            {r.same != null && <p className="type-caption text-muted-foreground">mismo suceso {r.same} · otro suceso {r.hardest}</p>}
          </div>
          {r.ms != null && <span className="type-caption ml-auto shrink-0 tabular-nums text-muted-foreground">{r.ms} ms</span>}
        </li>
      ))}
    </ul>
  )
}

export default function Brain() {
  const { t, locale } = useI18n()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(null)
  const [output, setOutput] = useState(null)
  const [tests, setTests] = useState(null)
  const [meta, setMeta] = useState(getSnapshotMeta)
  const inventory = useQuery({ queryKey: ['brain-inventory'], queryFn: loadInventory })

  async function run(key, fn) {
    setBusy(key)
    try {
      const result = await fn()
      setOutput({ key, result })
      await qc.invalidateQueries()
      toast({ title: t('brain.done') })
    } catch (error) {
      setOutput({ key, result: { error: String(error?.message || error) } })
      toast({ title: t('common.error'), description: String(error?.message || error), variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const engine = () => import('@/lib/news/localEngine')
  const btn = (key, label, fn, variant = 'outline', disabled = false) => (
    <Button key={key} variant={variant} size="sm" disabled={Boolean(busy) || disabled} onClick={() => run(key, fn)}>
      {busy === key ? <Loader2 className="animate-spin" /> : <Play />}
      {label}
    </Button>
  )

  async function runTests() {
    setBusy('tests')
    try {
      const [{ runEngineTests }, { runEvolutionTests }, { runEmbeddingBenchmark }] = await Promise.all([
        import('@/lib/news/tests'),
        import('@/lib/news/evolutionTests'),
        import('@/lib/news/embeddingBenchmark'),
      ])
      setTests({ engine: await runEngineTests(), evolution: runEvolutionTests(), embedding: runEmbeddingBenchmark() })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader as="h1" size="display" title={t('page.brain.title')} description={t('brain.subtitle')} />

      <Card title={t('brain.pipeline')} hint={t('brain.steps')}>
        {inventory.data && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {INVENTORY.map((name) => (
              <div key={name} className="rounded-xl border bg-card/50 p-3">
                <dd className="font-heading text-2xl font-semibold tabular-nums">{inventory.data.counts[name]}</dd>
                <dt className="type-caption text-muted-foreground">{name}</dt>
              </div>
            ))}
          </dl>
        )}
        {inventory.data?.pending > 0 && <p className="type-small text-warning">NewsItem pending: {inventory.data.pending}</p>}
      </Card>

      <Card title={t('brain.demo')} hint={t('brain.demoHint')}>
        <div className="flex flex-wrap gap-2">
          {btn('r1', t('brain.round1'), async () => (await engine()).runDemoRound(1), 'default')}
          {btn('r2', t('brain.round2'), async () => (await engine()).runDemoRound(2))}
          {btn('maint', t('brain.clean'), async () => (await engine()).runCleanup(30))}
        </div>
      </Card>

      <Card title={t('brain.real')} hint={t('brain.realHint')}>
        {meta ? (
          <dl className="type-small grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-muted-foreground">{t('brain.snapshotDate')}</dt>
            <dd>{formatDateTime(meta.generated_at, locale)}</dd>
            <dt className="text-muted-foreground">{t('brain.snapshotMode')}</dt>
            <dd>{meta.mode === 'real' ? t('brain.modeReal') : t('brain.modeDemo')}</dd>
          </dl>
        ) : (
          <p className="type-small text-muted-foreground">{t('brain.noSnapshot')}</p>
        )}
        {meta?.sources?.length > 0 && (
          <ul className="divide-y rounded-xl border">
            {meta.sources.map((s) => (
              <li key={s.name} className="flex items-center gap-3 px-4 py-2 text-sm">
                {s.ok ? <CheckCircle2 className="h-4 w-4 text-success" aria-label="OK" /> : <XCircle className="h-4 w-4 text-destructive" aria-label="Fallo" />}
                <span className="flex-1">{s.name}</span>
                <span className="type-caption text-muted-foreground">{s.ok ? `${s.items}` : s.error}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          {btn('sync', t('brain.syncNow'), async () => {
            const r = await syncSnapshot({ force: true })
            setMeta(r.meta)
            return r.meta
          }, 'default')}
        </div>
      </Card>

      {output && (
        <section className="glass-card p-5">
          <p className="eyebrow mb-2">{t('brain.result')}</p>
          <pre className={cn('max-h-80 overflow-auto rounded-xl bg-secondary/60 p-4 text-xs leading-relaxed', output.result?.error && 'text-destructive')}>{JSON.stringify(output.result, null, 2)}</pre>
        </section>
      )}

      <Card title={t('brain.tests')} hint={t('brain.testsHint')}>
        <Button size="sm" onClick={runTests} disabled={Boolean(busy)}>
          {busy === 'tests' ? <Loader2 className="animate-spin" /> : <Play />}
          {busy === 'tests' ? t('brain.running') : t('brain.runTests')}
        </Button>
        {tests && (
          <div className="space-y-4">
            <ResultList rows={tests.engine} />
            <ResultList rows={tests.evolution} />
            <p className="eyebrow pt-2">{t('brain.benchmark')}</p>
            <ResultList rows={tests.embedding} />
          </div>
        )}
      </Card>
    </div>
  )
}
