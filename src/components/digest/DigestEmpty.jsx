import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Portada vacía. En modo local (o admin) permite cargar datos de demostración. */
export default function DigestEmpty() {
  const { t } = useI18n()
  const { isLocalMode, user } = useAuth()
  const qc = useQueryClient()
  const [pending, setPending] = useState(false)
  const canSeed = isLocalMode || user?.role === 'admin'

  async function onSeed() {
    setPending(true)
    try {
      const { loadFullDemo } = await import('@/lib/news/localEngine') // el motor solo se descarga si se usa
      await loadFullDemo()
      await qc.invalidateQueries()
      toast({ title: t('home.demoLoaded') })
    } catch (error) {
      toast({ title: t('common.error'), description: String(error?.message || error), variant: 'destructive' })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="glass-card mx-auto max-w-xl px-6 py-14 text-center sm:px-10">
      <Newspaper className="mx-auto mb-5 h-8 w-8 text-primary/70" strokeWidth={1.5} aria-hidden="true" />
      <h2 className="type-h1 mb-3">{t('home.empty')}</h2>
      <p className="type-body mb-2 text-muted-foreground">{t('home.emptyBody')}</p>
      {isLocalMode && <p className="type-small mb-6 text-muted-foreground">{t('home.emptyLocal')}</p>}
      {canSeed && (
        <Button onClick={onSeed} disabled={pending} className="mt-4">
          {pending && <Loader2 className="animate-spin" />}
          {pending ? t('home.loadingDemo') : t('home.loadDemo')}
        </Button>
      )}
    </div>
  )
}
