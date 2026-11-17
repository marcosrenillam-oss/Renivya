import { Image } from '@/components/ui/image'
import { getCategory } from '@/lib/categories'
import { getStoryImage } from '@/lib/storyImage'
import { cn } from '@/lib/utils'

const TONES = {
  primary: ['hsl(var(--primary) / 0.22)', 'hsl(var(--primary) / 0.04)'],
  accent: ['hsl(var(--accent) / 0.24)', 'hsl(var(--accent) / 0.04)'],
  'chart-3': ['hsl(var(--chart-3) / 0.24)', 'hsl(var(--chart-3) / 0.04)'],
  'chart-4': ['hsl(var(--chart-4) / 0.24)', 'hsl(var(--chart-4) / 0.04)'],
  'chart-5': ['hsl(var(--chart-5) / 0.24)', 'hsl(var(--chart-5) / 0.04)'],
}

/**
 * Sin imagen (o si falla), una composición tipográfica sobria con el icono de la categoría.
 * Nunca se usa una imagen genérica que pueda confundirse con material de la noticia.
 */
export function StoryArt({ category, className }) {
  const meta = getCategory(category)
  const Icon = meta?.icon
  const [a, b] = TONES[meta?.tone ?? 'primary']
  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)} style={{ background: `radial-gradient(120% 90% at 85% 10%, ${a}, transparent 60%), linear-gradient(160deg, ${b}, hsl(var(--surface)))` }}>
      <svg className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden="true">
        <defs>
          <pattern id={`lines-${category}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="currentColor" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#lines-${category})`} className="text-foreground" />
      </svg>
      {Icon && <Icon className="absolute bottom-4 right-4 h-10 w-10 text-foreground/15" strokeWidth={1.2} aria-hidden="true" />}
    </div>
  )
}

export default function StoryImage({ story, media = [], className, eager = false, showCredit = false }) {
  const img = getStoryImage(story, media)
  const art = <StoryArt category={story?.category} />
  if (!img) return <div className={cn('overflow-hidden bg-surface', className)}>{art}</div>
  return (
    <Image
      src={img.url}
      alt={img.alt}
      loading={eager ? 'eager' : 'lazy'}
      className={className}
      fallback={art}
      credit={showCredit ? img.credit : null}
    />
  )
}
