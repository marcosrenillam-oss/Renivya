import { ExternalLink } from 'lucide-react'
import { getCountryFlag } from '@/lib/countries'
import { getLanguageName } from '@/lib/languages'
import { formatRelativeTime } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const ROLE_TONE = { primary: 'text-accent', corroboration: 'text-muted-foreground', contrast: 'text-warning', dissenting: 'text-destructive' }

function safeHref(url) {
  try {
    const u = new URL(url)
    // Las URLs de demostración (.invalid) no resuelven: no se enlazan.
    return (u.protocol === 'https:' || u.protocol === 'http:') && !u.hostname.endsWith('.invalid') ? url : null
  } catch {
    return null
  }
}

/** Una fuente de la historia: tipo, país, idioma, papel en el contraste y enlace al original. */
export default function SourceRow({ source }) {
  const { t, locale } = useI18n()
  const href = safeHref(source.url)
  const Tag = href ? 'a' : 'div'
  return (
    <li>
      <Tag
        {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={cn('flex items-start gap-3 py-3.5', href && 'group')}
      >
        <span className="mt-0.5 text-base" aria-hidden="true">{getCountryFlag(source.country) || '•'}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-semibold group-hover:text-primary">{source.source_name}</span>
            {source.source_type && <span className="type-caption text-muted-foreground">{t(`sourceType.${source.source_type}`)}</span>}
            {source.language && <span className="type-caption text-muted-foreground">· {getLanguageName(source.language, locale)}</span>}
          </div>
          {source.contribution && <p className="type-small mt-1 line-clamp-2 text-muted-foreground">{source.contribution}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {source.role && <span className={cn('type-caption font-medium', ROLE_TONE[source.role])}>{t(`role.${source.role}`)}</span>}
          {source.published_at && <span className="type-caption text-muted-foreground">{formatRelativeTime(source.published_at, locale)}</span>}
          {href && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />}
        </div>
      </Tag>
    </li>
  )
}
