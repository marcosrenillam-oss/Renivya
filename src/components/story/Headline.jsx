import { getHeadline } from '@/lib/headline'
import { cn } from '@/lib/utils'

const SIZES = {
  display: 'font-heading text-[2rem] leading-[1.06] sm:text-[2.6rem] lg:text-[3rem] font-semibold tracking-[-0.028em]',
  h1: 'type-h1',
  h2: 'type-h2',
  h3: 'type-h3',
}

const CLAMP = { 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4' }

/** El titular domina la jerarquía: Newsreader, interlineado ajustado, sin adornos. */
export default function Headline({ story, size = 'h2', as: Tag = 'h3', className, clamp }) {
  return (
    <Tag className={cn(SIZES[size], 'text-balance text-foreground', CLAMP[clamp], className)}>
      {getHeadline(story)}
    </Tag>
  )
}
