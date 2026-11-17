import { Link } from 'react-router-dom'
import Logo from '@/components/branding/Logo'
import LanguageSelector from '@/components/layout/LanguageSelector'
import StageAtmosphere from '@/components/common/StageAtmosphere'
import { useI18n } from '@/lib/i18n/I18nContext'
import { useAuth } from '@/lib/AuthContext'

/** Marco editorial común a las pantallas de acceso. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { t } = useI18n()
  const { isLocalMode } = useAuth()
  return (
    <div className="relative min-h-screen">
      <StageAtmosphere />
      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        <aside className="hidden flex-col justify-between px-12 py-14 lg:flex">
          <Link to="/" aria-label="RENIVYA">
            <Logo size={40} withWordmark />
          </Link>
          <div className="max-w-md">
            <p className="eyebrow mb-5">{t('app.tagline')}</p>
            <p className="font-heading text-[2.6rem] font-medium leading-[1.08] tracking-[-0.03em] text-foreground">
              Muchas fuentes.
              <br />
              <span className="italic text-primary">Una sola historia</span>
              <br />
              contrastada.
            </p>
          </div>
          <p className="type-caption text-muted-foreground">© RENIVYA</p>
        </aside>

        <main className="flex flex-col justify-center px-4 py-10 sm:px-8">
          <div className="mb-8 flex items-center justify-between lg:justify-end">
            <Link to="/" className="lg:hidden" aria-label="RENIVYA">
              <Logo size={34} withWordmark />
            </Link>
            <LanguageSelector compact />
          </div>
          <div className="glass-card mx-auto w-full max-w-md p-7 sm:p-9 animate-fade-up">
            <h1 className="type-h1 mb-2">{title}</h1>
            {subtitle && <p className="type-small mb-7 text-muted-foreground">{subtitle}</p>}
            {children}
          </div>
          {footer && <div className="type-small mx-auto mt-6 w-full max-w-md text-center text-muted-foreground">{footer}</div>}
          {isLocalMode && (
            <p className="type-caption mx-auto mt-4 w-full max-w-md text-center text-muted-foreground">{t('auth.localNotice')}</p>
          )}
        </main>
      </div>
    </div>
  )
}
