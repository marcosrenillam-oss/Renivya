/**
 * En el frontend el LLM solo se usa a través de funciones backend (consumen créditos):
 * la traducción se pide con requestStoryTranslation (src/lib/i18n/storyLocale.js),
 * y NUNCA desde el feed. SCORE, CONFIDENCE y categoría no pasan por aquí.
 */
export { requestStoryTranslation } from '@/lib/i18n/storyLocale'
