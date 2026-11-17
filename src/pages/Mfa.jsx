import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/auth/FormField'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { base44 } from '@/api/base44Client'
import { toast } from '@/components/ui/use-toast'

/** Verificación por código (OTP) enviada por email tras el registro. */
export default function Mfa() {
  const { t } = useI18n()
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await base44.auth.verifyOtp({ email, otpCode: code.trim() })
      if (res?.access_token && typeof base44.auth.setToken === 'function') base44.auth.setToken(res.access_token, true)
      const me = await refreshUser()
      navigate(me ? '/' : '/login', { replace: true })
    } catch (err) {
      setError(err?.message || t('auth.genericError'))
    } finally {
      setPending(false)
    }
  }

  async function onResend() {
    try {
      await base44.auth.resendOtp(email)
      toast({ title: t('auth.resent') })
    } catch {
      toast({ title: t('auth.genericError'), variant: 'destructive' })
    }
  }

  return (
    <AuthLayout
      title={t('auth.verifyTitle')}
      subtitle={t('auth.verifySubtitle', { email: email || '—' })}
      footer={
        <Link to="/login" className="hover:text-foreground">
          {t('auth.backToLogin')}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          label={t('auth.code')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="text-center text-lg tracking-[0.4em]"
          required
        />
        {error && <p className="type-small text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending || !code || !email}>
          {pending && <Loader2 className="animate-spin" />}
          {t('auth.verify')}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onResend} disabled={!email}>
          {t('auth.resend')}
        </Button>
      </form>
    </AuthLayout>
  )
}
