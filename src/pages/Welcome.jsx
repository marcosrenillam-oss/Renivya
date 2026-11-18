import { useState } from 'react'
import moment from 'moment'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCountryName } from '@/lib/countries'
import { flagEmoji } from '@/lib/flags'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { EDITIONS } from '../../engine/sourceCatalog.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Cabecera de periódico antiguo para las pantallas de entrada. */
function Masthead({ small = false }) {
  const { t, locale } = useI18n()
  const now = moment().locale(locale)
  return (
    <div>
      <div className="border-t-[3px] border-foreground" />
      <p className={cn('font-masthead py-1 text-center leading-[1.05]', small ? 'text-[44px]' : 'text-[clamp(64px,20vw,96px)]')}>Renivya</p>
      <div className="border-t-[3px] border-double border-foreground" />
      <div className="flex items-center justify-between py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-foreground/75">
        <span className="first-letter:uppercase">{now.format(locale === 'es' ? 'D [de] MMMM [de] YYYY' : 'MMMM D, YYYY')}</span>
        <span>{t('auth.specialEdition')}</span>
      </div>
      <div className="border-t border-foreground" />
    </div>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-foreground/70">{label}</span>
      {children}
      {(error || hint) && <span className={cn('mt-1 block text-[12px] italic', error ? 'text-destructive' : 'text-muted-foreground')}>{error || hint}</span>}
    </label>
  )
}

const inputClass = 'w-full border-0 border-b border-foreground bg-transparent px-0 py-2.5 font-serif-text text-[18px] text-foreground placeholder:text-foreground/30 outline-none focus:border-b-2'
const primaryBtn = 'w-full bg-foreground py-4 text-[12.5px] font-bold uppercase tracking-[0.22em] text-background transition active:scale-[0.99] disabled:opacity-60'

function LanguageToggle({ locale, setLocale }) {
  return (
    <div className="inline-flex border border-foreground">
      {['es', 'en'].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => {
            haptic()
            setLocale(code)
          }}
          className={cn('px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition', locale === code ? 'bg-foreground text-background' : 'text-foreground/60')}
        >
          {code === 'es' ? 'Español' : 'English'}
        </button>
      ))}
    </div>
  )
}

const slide = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
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
    <div className="min-h-screen-dvh grain relative flex flex-col bg-background text-foreground">
      <div className="safe-top safe-x relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between pb-3 pt-3">
          {step !== 'intro' ? (
            <button type="button" onClick={() => go(step === 'country' ? 'account' : 'intro')} className="-ml-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/70" aria-label={t('auth.back')}>
              <ArrowLeft className="h-3.5 w-3.5" /> {t('auth.back')}
            </button>
          ) : (
            <span />
          )}
          <LanguageToggle locale={locale} setLocale={setLocale} />
        </div>

        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div key="intro" {...slide} className="flex flex-1 flex-col">
              <Masthead />
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mt-6 font-display text-[40px] font-black leading-[1.02] tracking-[-0.015em]"
              >
                {t('auth.tagline')}
              </motion.h1>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-foreground pt-3 font-serif-text text-[13px] leading-snug text-foreground/75">
                <p className="first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-[36px] first-letter:font-black first-letter:leading-[0.85]">{t('auth.introCol1')}</p>
                <p className="border-l border-foreground/30 pl-4">{t('auth.introCol2')}</p>
              </div>
              <div className="flex-1" />
              <div className="mt-10 space-y-2 border-t-[3px] border-foreground pt-4">
                <button type="button" onClick={() => go('account')} className={primaryBtn}>
                  {t('auth.start')}
                </button>
                <button type="button" onClick={() => go('login')} className="w-full py-3 font-serif-text text-[15px] italic text-foreground/75 underline-offset-4 active:underline">
                  {t('auth.haveAccount')}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'account' && (
            <motion.form
              key="account"
              {...slide}
              className="flex flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault()
                if (validateAccount()) go('country')
                else haptic('medium')
              }}
            >
              <Masthead small />
              <h2 className="mt-5 font-display text-[32px] font-black leading-tight">{t('auth.createTitle')}</h2>
              <p className="mt-1 font-serif-text text-[15px] italic leading-relaxed text-foreground/70">{t('auth.createBody')}</p>
              <div className="mt-6 space-y-6">
                <Field label={t('auth.name')} error={errors.name}>
                  <input className={inputClass} value={form.name} onChange={set('name')} placeholder={t('auth.namePlaceholder')} autoComplete="given-name" autoFocus />
                </Field>
                <Field label={t('auth.email')} error={errors.email}>
                  <input className={inputClass} type="email" inputMode="email" value={form.email} onChange={set('email')} placeholder="nombre@gmail.com" autoComplete="email" autoCapitalize="none" />
                </Field>
                <Field label={t('auth.password')} hint={t('auth.passwordHint')} error={errors.password}>
                  <div className="relative">
                    <input className={cn(inputClass, 'pr-10')} type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-foreground/50" aria-label={t('auth.password')}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </Field>
              </div>
              <div className="flex-1" />
              <button type="submit" className={cn(primaryBtn, 'mt-10')}>
                {t('auth.continue')}
              </button>
            </motion.form>
          )}

          {step === 'country' && (
            <motion.div key="country" {...slide} className="flex flex-1 flex-col">
              <Masthead small />
              <h2 className="mt-5 font-display text-[32px] font-black leading-tight">{t('auth.countryTitle')}</h2>
              <p className="mt-1 font-serif-text text-[15px] italic text-foreground/70">{t('auth.countryBody')}</p>
              <div className="mt-5 grid grid-cols-2 gap-px border border-foreground bg-foreground">
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
                      className={cn('flex items-center gap-2.5 px-3 py-3.5 text-left transition', on ? 'bg-foreground text-background' : 'bg-background text-foreground')}
                    >
                      <span className="text-[22px] leading-none">{flagEmoji(code)}</span>
                      <span className="font-serif-text text-[15px] leading-tight">{getCountryName(code, locale)}</span>
                    </button>
                  )
                })}
                {EDITIONS.length % 2 === 1 && <span className="bg-background" />}
              </div>
              <div className="mt-6 border-t border-foreground pt-3">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-foreground/70">{t('auth.languageTitle')}</p>
                <p className="mb-3 mt-0.5 font-serif-text text-[13px] italic text-muted-foreground">{t('auth.languageBody')}</p>
                <LanguageToggle locale={locale} setLocale={setLocale} />
              </div>
              <div className="flex-1" />
              <button type="button" disabled={busy} onClick={finish} className={cn(primaryBtn, 'mt-10')}>
                {t('auth.enter')}
              </button>
            </motion.div>
          )}

          {step === 'login' && (
            <motion.form key="login" {...slide} onSubmit={doLogin} className="flex flex-1 flex-col">
              <Masthead small />
              <h2 className="mt-5 font-display text-[32px] font-black leading-tight">{t('auth.loginTitle')}</h2>
              <div className="mt-6 space-y-6">
                <Field label={t('auth.email')}>
                  <input className={inputClass} type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" autoCapitalize="none" autoFocus />
                </Field>
                <Field label={t('auth.password')} error={errors.login}>
                  <input className={inputClass} type="password" value={form.password} onChange={set('password')} autoComplete="current-password" />
                </Field>
              </div>
              <div className="flex-1" />
              <button type="submit" disabled={busy} className={cn(primaryBtn, 'mt-10')}>
                {t('auth.login')}
              </button>
              <button type="button" onClick={() => go('account')} className="mt-2 w-full py-3 font-serif-text text-[15px] italic text-foreground/75">
                {t('auth.noAccount')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
