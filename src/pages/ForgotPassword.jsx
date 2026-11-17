import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/auth/FormField'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/I18nContext'
import { base44 } from '@/api/base44Client'

export default function ForgotPassword() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setPending(true)
    try {
      await base44.auth.resetPasswordRequest(email.trim().toLowerCase())
    } catch {
      /* Respuesta idéntica exista o no la cuenta (no revelar usuarios). */
    } finally {
      setPending(false)
      setSent(true)
    }
  }

  return (
    <AuthLayout
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
      footer={
        <Link to="/login" className="hover:text-foreground">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      {sent ? (
        <p className="type-body text-muted-foreground" role="status">{t('auth.linkSent')}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <FormField id="email" type="email" autoComplete="email" label={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={pending || !email}>
            {pending && <Loader2 className="animate-spin" />}
            {t('auth.sendLink')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
