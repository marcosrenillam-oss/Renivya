import { Image } from '@/components/ui/image'
import { getCategory } from '@/lib/categories'
import { getStoryImage } from '@/lib/storyImage'
import { cn } from '@/lib/utils'

const PALETTES = {
  primary: ['#1b2d57', '#3d5cb8', '#0b1226'],
  accent: ['#6b4a10', '#e2b550', '#2a1d06'],
  'chart-3': ['#5a0f1c', '#d0435a', '#22060b'],
  'chart-4': ['#0f3d36', '#3fa58e', '#06201b'],
  'chart-5': ['#3a2160', '#9a6fd6', '#160b28'],
}

/**
 * Sin foto (o si falla la carga): composición de color por sección con el icono en cristal.
 * Nunca se usa una foto genérica que pueda confundirse con material de la noticia.
 */
export function StoryArt({ category, className }) {
  const meta = getCategory(category)
  const Icon = meta?.icon
  const [a, b, c] = PALETTES[meta?.tone ?? 'primary']
  return (
    <div
      className={cn('relative h-full w-full overflow-hidden', className)}
      style={{ background: `radial-gradient(120% 90% at 85% 0%, ${b}, transparent 55%), radial-gradient(90% 80% at 0% 100%, ${a}, transparent 60%), ${c}` }}
    >
      <div className="ken-burns absolute -inset-6 opacity-40" style={{ background: `conic-gradient(from 200deg at 60% 40%, transparent, ${b}55, transparent 40%)` }} />
      {Icon && (
        <span className="absolute left-1/2 top-1/2 flex h-[34%] max-h-20 min-h-9 w-auto -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-[7%] backdrop-blur-md" style={{ aspectRatio: '1' }}>
          <Icon className="h-full w-full text-white/85" strokeWidth={1.4} aria-hidden="true" />
        </span>
      )}
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
