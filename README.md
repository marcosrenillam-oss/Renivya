# RENIVYA — Inteligencia informativa global

Las noticias de tu país y del mundo: agrupa muchas fuentes en una sola **historia**,
contrasta versiones y calcula de forma **determinista** su relevancia y su solidez.
Cada lector elige su país (su portada muestra solo la prensa de ese país y lo que ocurre allí)
y su idioma (español o inglés, nunca mezclados).

**App:** https://marcosrenillam-oss.github.io/Renivya/
En el iPhone: ábrela en Safari → Compartir → **Añadir a pantalla de inicio**.

## Cómo funciona (sin servidor)

```
GitHub Actions (cada hora)                       Móvil / navegador
───────────────────────────                      ─────────────────────────────
feeds RSS ─► motor (engine/) ─► traducción es/en ─► data/app.json ─► la app lo descarga
   por país     ▲                 (API de Claude)                        al abrir
                └── data/snapshot.json anterior (estado del motor: las historias evolucionan)
```

- **Noticias:** `scripts/build-snapshot.mjs` descarga los feeds de `engine/sourceCatalog.js`,
  agrupa, contrasta, puntúa y redacta con el motor, y publica el resultado junto a la web.
  Si ningún feed responde, publica datos de demostración (`is_demo: true`) para que la app
  nunca salga vacía.
- **Idiomas:** el texto de cada historia sale de artículos en un único idioma. Si el lector
  usa otro, solo se muestra cuando existe la traducción completa (`Story.translations`),
  que hace `scripts/translate-stories.mjs` con la API de Claude si el repositorio tiene el
  secreto `ANTHROPIC_API_KEY`. Variables opcionales: `TRANSLATE_MODEL` (por defecto
  `claude-opus-5-5`) y `TRANSLATE_MAX` (traducciones por hora, por defecto 30).
- **Cuenta:** nombre, correo y contraseña, sin códigos de verificación. Se guarda en el
  dispositivo (la contraseña solo como hash PBKDF2), junto con el país y el idioma.
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
3. (Traducción) *Settings › Secrets and variables › Actions › New repository secret* →
   `ANTHROPIC_API_KEY`. Opcional, en *Variables*: `TRANSLATE_MODEL`, `TRANSLATE_MAX`.

## Estructura

```
engine/          motor determinista (normalización, firma semántica, clustering,
                 clasificador, contraste, relevancia, solidez, editorial, entidades,
                 media, evolución, snapshot)
scripts/         build-snapshot.mjs (noticias) · postbuild.mjs (404.html + precarga offline)
src/api/         almacén local con API de entidades
src/lib/         datos, i18n, sincronización de noticias, PWA
src/components/  interfaz (portada con primeras planas, historia, mundo 3D, analítica…)
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

- Resumen semanal en PDF por correo (necesita un servicio de envío de correo).
- Cuentas sincronizadas entre dispositivos (hoy viven en cada dispositivo).
