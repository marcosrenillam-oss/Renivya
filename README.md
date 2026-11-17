# RENIVYA — Inteligencia informativa global

Plataforma de inteligencia informativa: agrupa noticias de muchas fuentes en una sola
**Story**, contrasta versiones y calcula de forma **determinista** un índice de
relevancia (RENIVYA SCORE) y una confianza explicable, separados entre sí.

Web y app web instalable (PWA): en iPhone, Safari → Compartir → *Añadir a pantalla de inicio*.

## Arranque

```bash
npm install
cp .env.example .env   # opcional
npm run dev            # http://localhost:5173
npm run build          # producción (service worker activo solo en build)
```

- Con `VITE_BASE44_APP_ID` → SDK real de Base44 (`@/api/base44Client`).
- Sin él → **modo local**: adaptador con la misma API que el SDK, persistido en
  `localStorage`, RLS por propietario emulada en `Preference` y `SavedStory`.
  En el acceso aparece «Continuar en modo local» y la portada ofrece cargar
  **datos de demostración** (`is_demo: true`, fuentes ficticias en dominio `.invalid`).

## Arquitectura

```
Interfaz      src/pages, src/components
Lógica        src/lib/news/*             (reexporta el núcleo + servicios de interfaz)
Datos         src/lib/dataService.js     (sobre base44.entities)
Núcleo        base44/shared/news/*.ts    (una sola implementación para Deno y Vite)
Backend       base44/functions/*/entry.ts, base44/workflows/*.jsonc
Entidades     base44/entities/*.jsonc    (12)
```

El motor (normalización, firma semántica, embeddings, clustering, clasificador,
análisis de contraste, scoring, editorial, entidades, media, evolución) vive en
`base44/shared/news` como JavaScript estándar con extensión `.ts` (`// @ts-nocheck`):
lo ejecutan igual las funciones de Base44 (Deno) y la interfaz (Vite), así que SCORE,
confianza y categoría no pueden divergir entre backend y frontend.

### Principios aplicados

- Todo dato insertado lleva `is_demo`. Autor, crédito o licencia desconocidos → `null`.
- SCORE (importancia) y CONFIDENCE (solidez) son deterministas; nunca LLM.
  `confidence_context` pesa un 5 % del SCORE.
- Clasificador de categorías determinista y multilingüe; el LLM solo podría
  sugerir categoría cuando no hay señal (`method: 'fallback'`).
- Traducción: se lee `Story.translations[locale]`; `TranslateStoryContent` solo
  se invoca desde el detalle y solo si falta. Nunca en el feed.
- Portada y cronología sin métricas técnicas; las cifras viven en el detalle
  («Cómo lo medimos») y en Analítica.
- Story viva: `StoryUpdate` + `version` en cada cambio relevante (fuente nueva,
  corrección, discrepancia, resolución, última hora).
- Entidad reutilizable (`normalized_name`), `StoryEntity` idempotente y
  `EntityRelation` solo con evidencia explícita en una frase.
- Deduplicación por claves exactas: URL canónica, `content_hash`, `normalized_name`.

## Funciones backend (`base44/functions`)

| Función | Qué hace | Permiso |
|---|---|---|
| `FetchNewsFeeds` | RSS activos → NewsItem → pipeline → mantenimiento (`{ installSources: true }` instala el catálogo) | admin o tarea programada |
| `ProcessNewsItems` | Procesa NewsItem pendientes | admin o tarea programada |
| `TranslateStoryContent` | Traduce una Story si falta `translations[locale]` | usuario |
| `CleanOldStories` | Purga > 30 días (respeta historias guardadas) | admin o tarea programada |
| `EmbedArticles` | Precalcula embeddings con caché por `content_hash` | admin o tarea programada |
| `getWorldReport` | Informe por país y región | usuario |
| `TestEmbeddingMultilingual`, `TestSemanticIdentity` | Diagnósticos | admin |

Variables de entorno de las funciones: `CRON_SECRET` (cabecera `x-cron-secret` de las
tareas programadas) y, opcionalmente, `OPENAI_API_KEY` para embeddings remotos (si no
hay, se usa el proveedor local determinista).

Workflows (`base44/workflows`): **Ingesta de noticias** cada 30 min y **Limpieza de
noticias** diaria.

## Pruebas

```bash
npm test               # motor en Node (9 pruebas)
npm run test:functions # funciones backend en Deno con SDK simulado (requiere deno)
```

La página **Cerebro** (`/brain`) ejecuta además un autodiagnóstico en el navegador
sobre un almacén en memoria.

## Pendiente de verificar al desplegar en Base44

- Sintaxis de RLS `user_condition: { role: "admin" }` en las 10 entidades de noticias.
- Estructura exacta de carpetas de funciones (`<Nombre>/entry.ts` + `function.jsonc`)
  y formato de `base44/workflows/*.jsonc`.
- URLs del catálogo de feeds RSS (`sourceCatalog.ts`): no se han podido comprobar
  desde el entorno de desarrollo. Su fiabilidad está a `null` (`reliability:provisional`).
- Traducciones de interfaz: `es` y `en` completas; `fr` y `pt` parciales (caen a español).
