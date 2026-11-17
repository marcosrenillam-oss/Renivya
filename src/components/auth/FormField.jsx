import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function FormField({ id, label, error, ...inputProps }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="type-small font-medium text-muted-foreground">
        {label}
      </Label>
      <Input id={id} aria-invalid={Boolean(error)} {...inputProps} />
      {error && <p className="type-caption text-destructive">{error}</p>}
    </div>
  )
}
