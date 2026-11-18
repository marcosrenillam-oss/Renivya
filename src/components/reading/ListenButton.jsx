import { useEffect, useRef, useState } from 'react'
import { Headphones, Pause, Play, Square } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

/** Trozos cortos (por frases): iOS corta las locuciones largas a mitad. */
function chunks(text) {
  const sentences = String(text || '').replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*["»”]?\s*/g) || []
  const out = []
  let cur = ''
  for (const s of sentences) {
    if ((cur + s).length > 220 && cur) {
      out.push(cur.trim())
      cur = ''
    }
    cur += s
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices()
  const base = lang.slice(0, 2)
  const preferred = base === 'es' ? ['es-ES', 'es-MX', 'es-US'] : ['en-GB', 'en-US', 'en-AU']
  for (const code of preferred) {
    const v = voices.find((x) => x.lang?.replace('_', '-') === code && /premium|enhanced|natural/i.test(x.name)) || voices.find((x) => x.lang?.replace('_', '-') === code)
    if (v) return v
  }
  return voices.find((x) => x.lang?.startsWith(base)) || null
}

/**
 * Escuchar la noticia con la voz del propio dispositivo (sin coste ni conexión):
 * titular, entradilla y cuerpo, en el idioma en que se está leyendo.
 */
export default function ListenButton({ story, className }) {
  const { t, locale } = useI18n()
  const [state, setState] = useState('idle') // idle | playing | paused
  const queue = useRef([])
  const index = useRef(0)

  useEffect(() => () => supported() && window.speechSynthesis.cancel(), [])
  useEffect(() => {
    if (supported()) window.speechSynthesis.getVoices() // carga la lista de voces (Safari la da tarde)
  }, [])
  if (!supported()) return null

  const lang = locale === 'en' ? 'en-GB' : 'es-ES'
  const speakFrom = (i) => {
    const synth = window.speechSynthesis
    if (i >= queue.current.length) {
      setState('idle')
      return
    }
    index.current = i
    const u = new SpeechSynthesisUtterance(queue.current[i])
    u.lang = lang
    const voice = pickVoice(lang)
    if (voice) u.voice = voice
    u.rate = 1
    u.onend = () => speakFrom(index.current + 1)
    u.onerror = (e) => e.error !== 'interrupted' && e.error !== 'canceled' && setState('idle')
    synth.speak(u)
  }

  const start = () => {
    haptic()
    window.speechSynthesis.cancel()
    queue.current = chunks([story.title + '.', story.summary, ...(story.body || [])].filter(Boolean).join(' '))
    setState('playing')
    speakFrom(0)
  }
  const pause = () => {
    window.speechSynthesis.pause()
    setState('paused')
  }
  const resume = () => {
    window.speechSynthesis.resume()
    setState('playing')
  }
  const stop = () => {
    queue.current = []
    window.speechSynthesis.cancel()
    setState('idle')
  }

  const base = 'inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium'
  if (state === 'idle') {
    return (
      <button type="button" onClick={start} className={cn(base, 'border-foreground/40 text-foreground/80', className)}>
        <Headphones className="h-4 w-4" aria-hidden="true" />
        {t('read.listen')}
      </button>
    )
  }
  return (
    <span className={cn('inline-flex items-stretch', className)}>
      <button type="button" onClick={state === 'playing' ? pause : resume} className={cn(base, 'border-foreground bg-foreground text-background')}>
        {state === 'playing' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {state === 'playing' ? t('read.pause') : t('read.resume')}
      </button>
      <button type="button" onClick={stop} aria-label={t('read.stop')} className={cn(base, 'border-l-0 border-foreground px-2 text-foreground')}>
        <Square className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}
