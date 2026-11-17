import { cn } from '@/lib/utils'

export default function Spinner({ className, size = 20, label }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-muted-foreground', className)}>
      <span
        className="animate-spin rounded-full border-2 border-border border-t-primary"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      {label ? <span className="type-small">{label}</span> : <span className="sr-only">…</span>}
    </span>
  )
}
