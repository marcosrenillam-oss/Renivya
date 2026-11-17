import { cn } from '@/lib/utils'

/** Cabecera de sección editorial: antetítulo, titular dominante, entradilla y acción. */
export default function SectionHeader({ eyebrow, title, description, action, as: Tag = 'h2', size = 'h1', className }) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <Tag className={size === 'display' ? 'type-display' : size === 'h2' ? 'type-h2' : 'type-h1'}>{title}</Tag>
        {description && <p className="type-body mt-3 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
