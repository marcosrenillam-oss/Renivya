import { useState } from 'react'
import { Newspaper } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { formatDate } from '@/lib/format'
import { toast } from '@/components/ui/use-toast'
import { renderClipping } from '@/components/reading/clipping'
import { cn } from '@/lib/utils'

/** Comparte la noticia como un recorte de periódico (imagen); si no se puede, la descarga. */
export default function ClippingButton({ story, className }) {
  const { t, locale } = useI18n()
  const [busy, setBusy] = useState(false)

  async function onClick() {
    if (busy) return
    setBusy(true)
    try {
      const blob = await renderClipping({
        story,
        kicker: story.is_breaking ? t('story.breaking') : getCategoryLabel(story.category, t),
        dateLine: formatDate(story.published_at || new Date(), locale, locale === 'en' ? 'dddd, D MMMM YYYY' : 'dddd, D [de] MMMM [de] YYYY'),
        footer: `${window.location.host}${window.location.pathname}`.replace(/\/$/, ''),
      })
      if (!blob) throw new Error('sin imagen')
      const file = new File([blob], 'renivya.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: story.title })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'renivya.png'
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 5000)
        toast({ title: t('read.clippingSaved') })
      }
    } catch (e) {
      if (e?.name !== 'AbortError') toast({ title: t('read.clippingError') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" onClick={onClick} disabled={busy} className={cn('inline-flex items-center gap-1.5 border border-foreground/40 px-3 py-1.5 text-xs font-medium text-foreground/80 disabled:opacity-50', className)}>
      <Newspaper className="h-4 w-4" aria-hidden="true" />
      {busy ? t('read.clippingBusy') : t('read.clipping')}
    </button>
  )
}
