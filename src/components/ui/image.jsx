import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Contenedor de imagen editorial.
 * - Siempre object-fit: cover dentro de un contenedor con tamaño propio.
 * - Estado de carga (skeleton) y de error (fallback) sin saltos de layout.
 * - Nunca muestra crédito/autor inventado: solo lo que llega en `credit`.
 */
const Image = React.forwardRef(function Image(
  { src, alt = '', className, imgClassName, fallback = null, credit = null, loading = 'lazy', onError, ...props },
  ref
) {
  const [status, setStatus] = React.useState(src ? 'loading' : 'error')

  React.useEffect(() => {
    setStatus(src ? 'loading' : 'error')
  }, [src])

  return (
    <div ref={ref} className={cn('relative overflow-hidden bg-surface', className)} {...props}>
      {status === 'loading' && <div className="skeleton absolute inset-0 rounded-none" aria-hidden="true" />}
      {status === 'error' ? (
        fallback
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setStatus('loaded')}
          onError={(e) => {
            setStatus('error')
            onError?.(e)
          }}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName
          )}
        />
      )}
      {credit && status === 'loaded' && (
        <span className="absolute bottom-1.5 right-2 rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/90 backdrop-blur-sm">
          {credit}
        </span>
      )}
    </div>
  )
})

export { Image }
export default Image
