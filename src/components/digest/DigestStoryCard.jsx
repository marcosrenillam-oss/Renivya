import StoryCard from '@/components/story/StoryCard'

/** Tarjeta del digest (alias semántico de StoryCard en variante feature). */
export default function DigestStoryCard(props) {
  return <StoryCard variant="feature" {...props} />
}
