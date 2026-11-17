# RENIVYA — Inteligencia informativa global

Plataforma de inteligencia informativa: agrupa noticias de muchas fuentes en una sola
**Story**, contrasta versiones y calcula de forma determinista un índice de relevancia
(RENIVYA SCORE) y una confianza explicable.

## Arranque

```bash
npm install
cp .env.example .env   # opcional
npm run dev
```

- Con `VITE_BASE44_APP_ID` → usa el SDK real de Base44 (`@/api/base44Client`).
- Sin él → **modo local**: adaptador con la misma API que el SDK, persistido en
  `localStorage`, con RLS por propietario emulada en `Preference` y `SavedStory`.
  En la pantalla de acceso aparece «Continuar en modo local».

## Capas

```
Interfaz      src/pages, src/components
Lógica        src/lib/news/*            (fase 12)
Datos         src/lib/dataService.js    sobre base44.entities
Backend       base44/functions, base44/shared/news (fase 12)
```

## Estado de la reconstrucción

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Vite + Tailwind + tokens | ✅ |
| 2 | Providers (Auth, Theme, I18n, Query) y router | ✅ |
| 3 | 12 entidades (`base44/entities`) | ✅ |
| 4 | AppShell, Header, NavMenu, StatusBar | ✅ |
| 5 | dataService + categorías, países, idiomas, formato | ✅ |
| 6–13 | Digest, detalle, feed, analítica, World, Network, motor, workflows | pendiente de bloques 3–6 |
