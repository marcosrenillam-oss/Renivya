// 1. GitHub Pages no conoce las rutas de la app: sirve 404.html para cualquier ruta
//    desconocida, así que 404.html es una copia de index.html y React Router hace el resto.
// 2. El service worker recibe la lista de archivos de esta versión para precachearlos
//    (la app funciona sin conexión aunque nunca se haya abierto una pantalla).
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'

const DIST = 'dist'
if (!existsSync(join(DIST, 'index.html'))) process.exit(0)
copyFileSync(join(DIST, 'index.html'), join(DIST, '404.html'))

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}
const files = walk(DIST)
  .map((p) => relative(DIST, p).split('\\').join('/'))
  .filter((p) => /^(assets|icons|geo)\//.test(p))
  .sort()
const version = createHash('sha256').update(files.join('|')).digest('hex').slice(0, 12)
const swPath = join(DIST, 'sw.js')
const sw = readFileSync(swPath, 'utf8')
  .replace("const VERSION = 'renivya-dev'", `const VERSION = 'renivya-${version}'`)
  .replace('const PRECACHE = []', `const PRECACHE = ${JSON.stringify(files.map((f) => `./${f}`))}`)
writeFileSync(swPath, sw)
console.log(`postbuild: 404.html + sw.js (${files.length} archivos, versión ${version})`)
