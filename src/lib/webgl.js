/** Detección de WebGL sin importar three.js (para no cargarlo en el bundle principal). */
export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
  } catch {
    return false
  }
}
