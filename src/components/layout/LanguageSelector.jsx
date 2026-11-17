import { Check, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/** Selector del idioma de INTERFAZ. No traduce contenido (eso es storyLocale). */
export default function LanguageSelector({ compact = false, className }) {
  const { locale, setLocale, locales, t } = useI18n()
  const current = locales.find((l) => l.code === locale)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? 'sm' : 'default'} className={cn('gap-1.5 text-muted-foreground', className)} aria-label={t('header.language')}>
          <Languages aria-hidden="true" />
          <span className="text-xs font-semibold tracking-wider">{current?.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t('header.language')}</DropdownMenuLabel>
        {locales.map((l) => (
          <DropdownMenuItem key={l.code} onSelect={() => setLocale(l.code)}>
            <span className="flex-1">{l.label}</span>
            {l.code === locale && <Check className="text-primary" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
