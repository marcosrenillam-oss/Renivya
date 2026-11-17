import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import StoryFeed from '@/components/story/StoryFeed'
import { getCategory, categoryToneClass } from '@/lib/categories'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

export default function CategoryDetail({ category }) {
  const { t } = useI18n()
  const meta = getCategory(category)
  const Icon = meta?.icon
  return (
    <div className="space-y-8">
      <Link to="/categories" className="type-small inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('categories.all')}
      </Link>
      <header>
        <p className={cn('eyebrow mb-2 inline-flex items-center gap-2', categoryToneClass(category))}>
          {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
          {t('page.categories.title')}
        </p>
        <h1 className="type-display">{t(`category.${category}`)}</h1>
      </header>
      <StoryFeed category={category} sort="score" />
    </div>
  )
}
