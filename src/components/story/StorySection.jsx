import { cn } from '@/lib/utils'

/** Sección del detalle: antetítulo + contenido, con espacio negativo generoso. */
export default function StorySection({ title, id, children, className, aside }) {
  return (
    <section aria-labelledby={id} className={cn('scroll-mt-24', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={id} className="eyebrow text-foreground">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
