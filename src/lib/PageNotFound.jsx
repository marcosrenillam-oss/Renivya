import { Link, useLocation } from 'react-router-dom'
import Logo from '@/components/branding/Logo'
import { useI18n } from '@/lib/i18n/I18nContext'
import { Button } from '@/components/ui/button'

export default function PageNotFound() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg text-center animate-fade-up">
        <Logo size={48} className="mx-auto mb-8" />
        <p className="eyebrow mb-3">404</p>
        <h1 className="type-display mb-4">{t('notFound.title')}</h1>
        <p className="type-body mb-8 text-muted-foreground">
          {t('notFound.body', { path: pathname })}
        </p>
        <Button asChild>
          <Link to="/">{t('notFound.home')}</Link>
        </Button>
      </div>
    </main>
  )
}
