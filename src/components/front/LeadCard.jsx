import FeatureCard from '@/components/front/FeatureCard'

/** Noticia principal de una sección (misma pieza que la destacada de portada). */
export default function LeadCard({ story, rank }) {
  return <FeatureCard story={story} rank={rank} tall />
}
