export function SettingsCard({ title, description, children }) {
  return (
    <section className="glass-card p-5 sm:p-7">
      <h2 className="type-h2 mb-1">{title}</h2>
      {description && <p className="type-small mb-6 text-muted-foreground">{description}</p>}
      <div className={description ? 'space-y-6' : 'mt-5 space-y-6'}>{children}</div>
    </section>
  )
}

export function SettingsRow({ label, hint, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
        {hint && <p className="type-caption mt-0.5 text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function RangeField({ id, value, onChange, min = 0, max = 100, step = 5 }) {
  return (
    <div className="flex items-center gap-3">
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-40 accent-[hsl(var(--primary))]" />
      <span className="w-8 text-right text-sm tabular-nums text-muted-foreground">{value}</span>
    </div>
  )
}
