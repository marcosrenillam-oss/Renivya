import { Link } from 'react-router-dom'
import CategoryChip from '@/components/story/CategoryChip'
import { getHeadline } from '@/lib/headline'

/** Vista previa mínima de la historia principal de un país. */
export default function StoryPeek({ story }) {
  if (!story) return null
  return (
    <Link to={`/story/${story.id}`} className="block rounded-xl border bg-card/60 p-3 hover:border-foreground/30">
      <CategoryChip category={story.category} />
      <p className="mt-1 font-heading text-sm font-semibold leading-snug">{getHeadline(story)}</p>
    </Link>
  )
}
