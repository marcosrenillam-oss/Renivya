import { Bookmark } from 'lucide-react'
import { useSavedStories } from '@/hooks/useSavedStories'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

export default function SaveButton({ storyId, withLabel = false, className }) {
  const { t } = useI18n()
  const { isSaved, toggle } = useSavedStories()
  const saved = isSaved(storyId)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(storyId)
      }}
      aria-pressed={saved}
      aria-label={saved ? t('story.unsave') : t('story.save')}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        withLabel ? 'border px-3 py-1.5 text-xs font-medium' : 'p-1.5',
        saved && 'text-primary hover:text-primary',
        className
      )}
    >
      <Bookmark className={cn('h-4 w-4 transition-transform', saved && 'scale-110 fill-current')} aria-hidden="true" />
      {withLabel && <span>{saved ? t('story.saved') : t('story.save')}</span>}
    </button>
  )
}
