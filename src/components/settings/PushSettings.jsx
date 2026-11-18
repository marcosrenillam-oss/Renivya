import { useState } from 'react'
import { Bell, Check, Copy } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { enablePush, pushSupport, savedPush, testNotification } from '@/lib/pushSetup'
import { haptic } from '@/lib/haptics'

/** Enlace a la pantalla de secretos del repositorio (deducido de la dirección de GitHub Pages). */
function secretsUrl() {
  const owner = location.hostname.endsWith('.github.io') ? location.hostname.split('.')[0] : null
  const repo = import.meta.env.BASE_URL.replace(/\//g, '')
  return owner && repo ? `https://github.com/${owner}/${repo}/settings/secrets/actions/new` : 'https://github.com/'
}

/** Perfil → Avisos de última hora: activar, copiar el código para GitHub y probar. */
export default function PushSettings() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const support = pushSupport()
  const [saved, setSaved] = useState(savedPush)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const activate = async () => {
    setBusy(true)
    setError(null)
    try {
      haptic('medium')
      setSaved(await enablePush({ edition: user?.country || 'ES', locale }))
    } catch (err) {
      setError(err?.message === 'permission' ? t('push.denied') : t('push.failed'))
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(saved.code)
      setCopied(true)
      haptic()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* el usuario puede seleccionar el texto a mano */
    }
  }

  if (!support.ok) {
    return <p className="py-3 font-serif-text text-[14px] italic text-muted-foreground">{support.ios && !support.standalone ? t('push.installFirst') : t('push.unsupported')}</p>
  }

  return (
    <div className="space-y-3 py-3">
      <p className="font-serif-text text-[14.5px] leading-snug text-foreground/80">{t('push.body')}</p>
      {!saved ? (
        <button type="button" disabled={busy} onClick={activate} className="flex w-full items-center justify-center gap-2 bg-foreground py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-background disabled:opacity-60">
          <Bell className="h-4 w-4" /> {t('push.enable')}
        </button>
      ) : (
        <>
          <ol className="list-decimal space-y-1 pl-5 font-serif-text text-[14px] leading-snug text-foreground/85">
            <li>{t('push.step1')}</li>
            <li>
              {t('push.step2')}{' '}
              <a href={secretsUrl()} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                GitHub
              </a>
              .
            </li>
            <li>
              {t('push.step3')} <code className="bg-muted px-1 text-[12px]">RENIVYA_AVISOS</code>.
            </li>
          </ol>
          <textarea readOnly value={saved.code} rows={3} onFocus={(e) => e.target.select()} className="w-full resize-none border border-foreground/40 bg-transparent p-2 font-mono text-[11px] leading-tight text-foreground/70" />
          <div className="flex gap-2">
            <button type="button" onClick={copy} className="flex flex-1 items-center justify-center gap-2 bg-foreground py-2.5 text-[11.5px] font-bold uppercase tracking-[0.16em] text-background">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? t('push.copied') : t('push.copy')}
            </button>
            <button type="button" onClick={() => testNotification('RENIVYA', t('push.testBody'))} className="flex-1 border border-foreground py-2.5 text-[11.5px] font-bold uppercase tracking-[0.16em]">
              {t('push.test')}
            </button>
          </div>
          <button type="button" onClick={activate} className="w-full py-1 text-[12px] italic text-muted-foreground underline-offset-2 active:underline">
            {t('push.regenerate')}
          </button>
        </>
      )}
      {error && <p className="text-[13px] italic text-destructive">{error}</p>}
    </div>
  )
}
