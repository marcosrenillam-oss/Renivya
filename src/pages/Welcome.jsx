import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react'
import Logo from '@/components/branding/Logo'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCountryName } from '@/lib/countries'
import { flagEmoji } from '@/lib/flags'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { EDITIONS } from '../../engine/sourceCatalog.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-white/70">{label}</span>
      {children}
      {(error || hint) && <span className={cn('mt-1.5 block text-[12px]', error ? 'text-[#ff8a96]' : 'text-white/45')}>{error || hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 text-[16px] text-white placeholder:text-white/30 outline-none transition focus:border-[#E2B550]/70 focus:bg-white/[0.09]'

function LanguageToggle({ locale, setLocale }) {
  return (
    <div className="inline-flex rounded-full border border-white/12 bg-white/[0.05] p-1">
      {['es', 'en'].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => {
            haptic()
            setLocale(code)
          }}
          className={cn('rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition', locale === code ? 'bg-[#E2B550] text-[#0B1226]' : 'text-white/60')}
        >
          {code === 'es' ? 'Español' : 'English'}
        </button>
      ))}
    </div>
  )
}

const slide = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -28, transition: { duration: 0.2 } },
}

export default function Welcome() {
  const { register, login } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const [step, setStep] = useState('intro')
  const [form, setForm] = useState({ name: '', email: '', password: '', country: 'ES' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validateAccount = () => {
    const next = {}
    if (!form.name.trim()) next.name = t('auth.errorName')
    if (!EMAIL_RE.test(form.email.trim())) next.email = t('auth.errorEmail')
    if (form.password.length < 6) next.password = t('auth.errorPassword')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const finish = async () => {
    setBusy(true)
    try {
      haptic('medium')
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, country: form.country, locale })
    } catch (err) {
      setErrors({ email: err?.code === 'already_registered' ? t('auth.errorExists') : err?.message })
      setStep('account')
    } finally {
      setBusy(false)
    }
  }

  const doLogin = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const me = await login(form.email.trim(), form.password)
      if (me?.locale) setLocale(me.locale)
      haptic('medium')
    } catch {
      setErrors({ login: t('auth.errorLogin') })
    } finally {
      setBusy(false)
    }
  }

  const go = (s) => {
    haptic()
    setErrors({})
    setStep(s)
  }

  return (
    <div
      className="min-h-screen-dvh relative flex flex-col overflow-hidden text-white"
      style={{ background: 'radial-gradient(120% 70% at 20% 0%, #1B2D57 0%, #0E1A33 45%, #060B17 100%)' }}
    >
      <div className="safe-top safe-x relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between pt-4">
          {step !== 'intro' ? (
            <button type="button" onClick={() => go(step === 'country' ? 'account' : 'intro')} className="-ml-2 rounded-full p-2 text-white/70" aria-label={t('auth.back')}>
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span />
          )}
          <LanguageToggle locale={locale} setLocale={setLocale} />
        </div>

        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div key="intro" {...slide} className="flex flex-1 flex-col justify-end">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <Logo size={84} />
              </motion.div>
              <h1 className="mt-8 font-display text-[44px] font-bold leading-[1.02] tracking-[0.02em]">RENIVYA</h1>
              <p className="mt-3 max-w-xs font-serif text-[19px] leading-snug text-white/75">{t('auth.tagline')}</p>
              <div className="mt-12 space-y-3">
                <button type="button" onClick={() => go('account')} className="w-full rounded-2xl bg-[#E2B550] py-4 text-[16px] font-semibold text-[#0B1226] shadow-[0_12px_30px_-12px_rgba(226,181,80,0.6)] active:scale-[0.99]">
                  {t('auth.start')}
                </button>
                <button type="button" onClick={() => go('login')} className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white/75">
                  {t('auth.haveAccount')}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'account' && (
            <motion.form
              key="account"
              {...slide}
              className="flex flex-1 flex-col pt-8"
              onSubmit={(e) => {
                e.preventDefault()
                if (validateAccount()) go('country')
                else haptic('medium')
              }}
            >
              <h2 className="font-display text-[34px] font-bold leading-tight">{t('auth.createTitle')}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">{t('auth.createBody')}</p>
              <div className="mt-8 space-y-5">
                <Field label={t('auth.name')} error={errors.name}>
                  <input className={inputClass} value={form.name} onChange={set('name')} placeholder={t('auth.namePlaceholder')} autoComplete="given-name" autoFocus />
                </Field>
                <Field label={t('auth.email')} error={errors.email}>
                  <input className={inputClass} type="email" inputMode="email" value={form.email} onChange={set('email')} placeholder="nombre@gmail.com" autoComplete="email" autoCapitalize="none" />
                </Field>
                <Field label={t('auth.password')} hint={t('auth.passwordHint')} error={errors.password}>
                  <div className="relative">
                    <input className={cn(inputClass, 'pr-12')} type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50" aria-label={t('auth.password')}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </Field>
              </div>
              <div className="flex-1" />
              <button type="submit" className="mt-10 w-full rounded-2xl bg-[#E2B550] py-4 text-[16px] font-semibold text-[#0B1226] active:scale-[0.99]">
                {t('auth.continue')}
              </button>
            </motion.form>
          )}

          {step === 'country' && (
            <motion.div key="country" {...slide} className="flex flex-1 flex-col pt-8">
              <h2 className="font-display text-[34px] font-bold leading-tight">{t('auth.countryTitle')}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">{t('auth.countryBody')}</p>
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {EDITIONS.map((code) => {
                  const on = form.country === code
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        haptic()
                        setForm((f) => ({ ...f, country: code }))
                      }}
                      className={cn(
                        'relative flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition',
                        on ? 'border-[#E2B550] bg-[#E2B550]/12' : 'border-white/10 bg-white/[0.04]'
                      )}
                    >
                      <span className="text-[26px] leading-none">{flagEmoji(code)}</span>
                      <span className="text-[15px] font-medium leading-tight">{getCountryName(code, locale)}</span>
                      {on && <Check className="absolute right-3 top-3 h-4 w-4 text-[#E2B550]" />}
                    </button>
                  )
                })}
              </div>
              <div className="mt-7">
                <p className="text-[13px] font-medium text-white/70">{t('auth.languageTitle')}</p>
                <p className="mb-3 text-[12px] text-white/45">{t('auth.languageBody')}</p>
                <LanguageToggle locale={locale} setLocale={setLocale} />
              </div>
              <div className="flex-1" />
              <button type="button" disabled={busy} onClick={finish} className="mt-10 w-full rounded-2xl bg-[#E2B550] py-4 text-[16px] font-semibold text-[#0B1226] disabled:opacity-60 active:scale-[0.99]">
                {t('auth.enter')}
              </button>
            </motion.div>
          )}

          {step === 'login' && (
            <motion.form key="login" {...slide} onSubmit={doLogin} className="flex flex-1 flex-col pt-8">
              <h2 className="font-display text-[34px] font-bold leading-tight">{t('auth.loginTitle')}</h2>
              <div className="mt-8 space-y-5">
                <Field label={t('auth.email')}>
                  <input className={inputClass} type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" autoCapitalize="none" autoFocus />
                </Field>
                <Field label={t('auth.password')} error={errors.login}>
                  <input className={inputClass} type="password" value={form.password} onChange={set('password')} autoComplete="current-password" />
                </Field>
              </div>
              <div className="flex-1" />
              <button type="submit" disabled={busy} className="mt-10 w-full rounded-2xl bg-[#E2B550] py-4 text-[16px] font-semibold text-[#0B1226] disabled:opacity-60">
                {t('auth.login')}
              </button>
              <button type="button" onClick={() => go('account')} className="mt-3 w-full py-3 text-[15px] font-medium text-white/70">
                {t('auth.noAccount')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
      <div className="pointer-events-none absolute -right-24 top-24 opacity-[0.05]">
        <Logo size={420} bare className="text-[#E2B550]" />
      </div>
    </div>
  )
}
