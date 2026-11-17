import { listStoryMedia } from '@/lib/dataService'
import { getStoryImage } from '@/lib/storyImage'

/** Imagen a mostrar en el detalle: Media primaria con procedencia, o Story.image_url. */
export async function resolveStoryMedia(story) {
  if (!story?.id) return null
  const media = await listStoryMedia(story.id)
  return getStoryImage(story, media)
}
