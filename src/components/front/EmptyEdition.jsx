import { Newspaper } from 'lucide-react'

export default function EmptyEdition({ title, hint }) {
  return (
    <div className="safe-x flex flex-col items-center py-16 text-center">
      <Newspaper className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.3} />
      <p className="mt-4 max-w-xs font-display text-[19px] font-semibold">{title}</p>
      {hint && <p className="mt-2 max-w-xs text-[14px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
