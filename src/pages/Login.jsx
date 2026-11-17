import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/auth/FormField'
import { authErrorKey } from '@/components/auth/authErrors'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { base44 } from '@/api/base44Client'

function safeReturnTo(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export default function Login() {
  const { t } = useI18n()
  const { login, loginAsLocalGuest, isLocalMode } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email.trim(), password)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(t(authErrorKey(err)))
    } finally {
      setPending(false)
    }
  }

  async function onLocal() {
    await loginAsLocalGuest()
    navigate(returnTo, { replace: true })
  }

  return (
    <AuthLayout
      title={t('auth.signInTitle')}
      subtitle={t('auth.signInSubtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t('auth.register')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField id="email" type="email" autoComplete="email" label={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <FormField
          id="password"
          type="password"
          autoComplete="current-password"
          label={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="type-small text-muted-foreground hover:text-foreground">
            {t('auth.forgot')}
          </Link>
        </div>
        {error && <p className="type-small text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending || !email || !password}>
          {pending && <Loader2 className="animate-spin" />}
          {t('auth.signIn')}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="type-caption text-muted-foreground">{t('auth.or')}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {isLocalMode ? (
        <Button variant="outline" className="w-full" onClick={onLocal}>
          {t('auth.local')}
        </Button>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => base44.auth.loginWithProvider('google', returnTo)}>
          {t('auth.google')}
        </Button>
      )}
    </AuthLayout>
  )
}
