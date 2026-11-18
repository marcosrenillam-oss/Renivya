# RENIVYA — Inteligencia informativa global

Agrupa noticias de muchas fuentes en una sola **historia**, contrasta versiones y
calcula de forma **determinista** su relevancia y su solidez (dos medidas distintas).

**App:** https://marcosrenillam-oss.github.io/Renivya/
En el iPhone: ábrela en Safari → Compartir → **Añadir a pantalla de inicio**.

## Cómo funciona (sin servidor)

```
GitHub Actions (cada hora)                       Móvil / navegador
───────────────────────────                      ─────────────────────────────
feeds RSS ─► motor (engine/) ─► data/snapshot.json ─► la app lo descarga al abrir
                ▲                                     y lo guarda en el dispositivo
                └── snapshot anterior (las historias evolucionan entre ejecuciones)
```

- **Noticias:** `scripts/build-snapshot.mjs` descarga los feeds de `engine/sourceCatalog.js`,
  agrupa, contrasta, puntúa y redacta con el motor, y publica el resultado junto a la web.
  Si ningún feed responde, publica datos de demostración (`is_demo: true`) para que la app
  nunca salga vacía.
- **Preferencias y guardadas:** solo en el dispositivo (sin cuentas ni contraseñas).
- **Sin conexión:** la app entera queda guardada al instalarla; muestra las últimas noticias
  descargadas.

## Desarrollo

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # pruebas del motor (Node)
npm run snapshot       # generar noticias reales (RSS) en public/data/snapshot.json
npm run snapshot:demo  # generar noticias de demostración
npm run build          # compilación de producción
```

## Publicación

`.github/workflows/deploy.yml` prueba, genera las noticias, compila y publica en
GitHub Pages en cada push a `main`, cada hora y a mano (pestaña *Actions*).

Configuración única del repositorio:
1. *Settings › General › Default branch* → `main`.
2. *Settings › Pages › Build and deployment › Source* → **GitHub Actions**.

## Estructura

```
engine/          motor determinista (normalización, firma semántica, clustering,
                 clasificador, contraste, relevancia, solidez, editorial, entidades,
                 media, evolución, snapshot)
scripts/         build-snapshot.mjs (noticias) · postbuild.mjs (404.html + precarga offline)
src/api/         almacén local con API de entidades
src/lib/         datos, i18n, sincronización de noticias, PWA
src/components/  interfaz (portada, historia, mundo 3D, red, analítica…)
src/pages/       pantallas
docs/entities/   modelo de datos (12 entidades)
```

## Principios

- Todo dato lleva `is_demo`. Autor, crédito o licencia desconocidos → `null`.
- Relevancia y solidez deterministas (nunca IA); la solidez pesa solo un 5 % en la relevancia.
- Clasificador de categorías determinista y multilingüe.
- Portada y cronología sin métricas técnicas (viven en el detalle y en Analítica).
- Historia viva: cada cambio relevante queda en el historial y sube la versión.
- Deduplicación por claves exactas (URL canónica, hash de contenido, nombre normalizado).

## Pendiente

- Comprobar con la primera ejecución en GitHub qué feeds RSS responden (página *Cerebro*
  muestra el estado de cada fuente) y ajustar el catálogo.
- Traducción automática de historias (necesitaría un servicio externo).
- Traducciones de interfaz: `es` y `en` completas; `fr` y `pt` parciales.
