import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/auth/FormField'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/I18nContext'
import { base44 } from '@/api/base44Client'

export default function ResetPassword() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const resetToken = params.get('token') || params.get('reset_token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (password.length < 8) return setError(t('auth.passwordShort'))
    if (password !== confirm) return setError(t('auth.passwordsMismatch'))
    setError(null)
    setPending(true)
    try {
      await base44.auth.resetPassword({ resetToken, newPassword: password })
      setDone(true)
    } catch {
      setError(t('auth.missingToken'))
    } finally {
      setPending(false)
    }
  }

  const footer = (
    <Link to="/login" className="hover:text-foreground">
      {t('auth.backToLogin')}
    </Link>
  )

  if (!resetToken) {
    return (
      <AuthLayout title={t('auth.resetTitle')} footer={footer}>
        <p className="type-body text-muted-foreground">{t('auth.missingToken')}</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')} footer={footer}>
      {done ? (
        <p className="type-body text-muted-foreground" role="status">{t('auth.resetDone')}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <FormField id="new-password" type="password" autoComplete="new-password" label={t('auth.newPassword')} value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormField id="confirm-password" type="password" autoComplete="new-password" label={t('auth.confirmPassword')} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="type-small text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending || !password || !confirm}>
            {pending && <Loader2 className="animate-spin" />}
            {t('common.save')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
