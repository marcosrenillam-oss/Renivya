import { ShieldAlert } from 'lucide-react'
import Logo from '@/components/branding/Logo'
import { useI18n } from '@/lib/i18n/I18nContext'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@/components/ui/button'

export default function UserNotRegisteredError() {
  const { t } = useI18n()
  const { logout } = useAuth()
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-card w-full max-w-md p-8 text-center animate-scale-in">
        <Logo size={44} className="mx-auto mb-6" />
        <ShieldAlert className="mx-auto mb-3 h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="type-h1 mb-3">{t('notRegistered.title')}</h1>
        <p className="type-body mb-6 text-muted-foreground">{t('notRegistered.body')}</p>
        <Button variant="outline" onClick={logout}>{t('header.signOut')}</Button>
      </div>
    </main>
  )
}
