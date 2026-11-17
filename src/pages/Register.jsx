import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import FormField from '@/components/auth/FormField'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/I18nContext'
import { base44 } from '@/api/base44Client'

export default function Register() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError(t('auth.passwordShort'))
      return
    }
    setError(null)
    setPending(true)
    try {
      const normalized = email.trim().toLowerCase()
      await base44.auth.register({ email: normalized, password })
      navigate(`/mfa?email=${encodeURIComponent(normalized)}`)
    } catch (err) {
      setError(err?.message || t('auth.genericError'))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth.signIn')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField id="email" type="email" autoComplete="email" label={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <FormField
          id="password"
          type="password"
          autoComplete="new-password"
          label={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="type-small text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending || !email || !password}>
          {pending && <Loader2 className="animate-spin" />}
          {t('auth.register')}
        </Button>
      </form>
    </AuthLayout>
  )
}
