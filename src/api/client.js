import { createLocalClient } from '@/api/localClient'

/**
 * Cliente de datos de RENIVYA (sin servidor).
 * - Noticias: llegan en /data/snapshot.json (generado cada hora por GitHub Actions)
 *   y se guardan en este dispositivo (ver src/lib/snapshotSync.js).
 * - Preferencias y guardadas: solo en este dispositivo.
 * Misma API que un cliente de entidades (list/filter/get/create/update/delete…).
 */
export const client = createLocalClient()
export default client
