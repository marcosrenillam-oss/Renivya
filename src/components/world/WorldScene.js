import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { cssColor, latLngToVector3 } from '@/lib/worldGeo'
import { getCountryCoordinates } from '@/lib/countryCoordinates'

const ATMOSPHERE_VERTEX = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const ATMOSPHERE_FRAGMENT = `
uniform vec3 glowColor;
uniform float strength;
varying vec3 vNormal;
void main() {
  float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
  gl_FragColor = vec4(glowColor, 1.0) * intensity * strength;
}`

function dotTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  g.beginPath()
  g.arc(32, 32, 28, 0, Math.PI * 2)
  g.fillStyle = '#fff'
  g.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Escena imperativa del globo (three.js). React solo la monta, le pasa datos y escucha eventos.
 */
export class GlobeScene {
  constructor(canvas, { reducedMotion = false, onPick, onFrame } = {}) {
    this.canvas = canvas
    this.onPick = onPick
    this.onFrame = onFrame
    this.reducedMotion = reducedMotion
    this.markers = new Map()
    this.selected = null

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    // Vista inicial sobre Europa y África (lat 28, lng 8).
    this.camera.position.copy(latLngToVector3(28, 8, 3.4))

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enablePan = false
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.rotateSpeed = 0.5
    this.controls.minDistance = 1.7
    this.controls.maxDistance = 5
    this.controls.autoRotate = !reducedMotion
    this.controls.autoRotateSpeed = 0.35

    this.globe = new THREE.Group()
    this.scene.add(this.globe)

    this.ocean = new THREE.Mesh(new THREE.SphereGeometry(0.995, 64, 64), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.92 }))
    this.globe.add(this.ocean)

    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.14, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: ATMOSPHERE_FRAGMENT,
        uniforms: { glowColor: { value: new THREE.Color() }, strength: { value: 0.9 } },
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    )
    this.scene.add(this.atmosphere)

    this.markerGroup = new THREE.Group()
    this.globe.add(this.markerGroup)
    this.dotTex = dotTexture()

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.down = null
    this.handleDown = (e) => {
      this.down = { x: e.clientX, y: e.clientY }
      this.controls.autoRotate = false
    }
    this.handleUp = (e) => {
      if (this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) < 6) this.pick(e)
      this.down = null
    }
    canvas.addEventListener('pointerdown', this.handleDown)
    canvas.addEventListener('pointerup', this.handleUp)

    this.applyTheme()
    this.clock = new THREE.Clock()
    this.loop = this.loop.bind(this)
    this.frame = requestAnimationFrame(this.loop)
  }

  applyTheme() {
    const dark = document.documentElement.classList.contains('dark')
    // Océano casi neutro (tono de tarjeta) con un matiz mínimo de cian mineral: sin azul abusivo.
    const base = cssColor(dark ? '--card' : '--surface')
    this.ocean.material.color = base.lerp(cssColor('--accent'), dark ? 0.06 : 0.05)
    this.landColor = cssColor('--muted-foreground').lerp(cssColor('--foreground'), dark ? 0.1 : 0.25)
    if (this.land) this.land.material.color = this.landColor
    this.atmosphere.material.uniforms.glowColor.value = cssColor('--accent')
    this.atmosphere.material.uniforms.strength.value = dark ? 0.9 : 0.55
    this.markerColor = cssColor('--primary')
    this.markers.forEach((m) => {
      m.dot.material.color = this.markerColor
      m.halo.material.color = this.markerColor
    })
  }

  setLand(points) {
    const positions = new Float32Array((points.length / 2) * 3)
    for (let i = 0; i < points.length; i += 2) {
      const v = latLngToVector3(points[i], points[i + 1], 1.0)
      positions.set([v.x, v.y, v.z], (i / 2) * 3)
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ size: 0.019, map: this.dotTex, transparent: true, alphaTest: 0.4, color: this.landColor, depthWrite: false })
    if (this.land) this.globe.remove(this.land)
    this.land = new THREE.Points(geom, mat)
    this.globe.add(this.land)
  }

  /** countries: [{ code, intensity, breaking }] */
  setMarkers(countries) {
    for (const m of this.markers.values()) this.markerGroup.remove(m.group)
    this.markers.clear()
    for (const c of countries) {
      const coords = getCountryCoordinates(c.code)
      if (!coords) continue
      const pos = latLngToVector3(coords[0], coords[1], 1.008)
      const size = 0.012 + 0.022 * Math.sqrt(c.intensity ?? 0.2)
      const group = new THREE.Group()
      group.position.copy(pos)
      group.lookAt(pos.clone().multiplyScalar(2))
      const dot = new THREE.Mesh(new THREE.CircleGeometry(size, 32), new THREE.MeshBasicMaterial({ color: this.markerColor, transparent: true, opacity: 0.95 }))
      const halo = new THREE.Mesh(new THREE.RingGeometry(size * 1.35, size * 1.6, 48), new THREE.MeshBasicMaterial({ color: this.markerColor, transparent: true, opacity: 0.35, side: THREE.DoubleSide }))
      dot.userData.code = c.code
      group.add(halo, dot)
      this.markerGroup.add(group)
      this.markers.set(c.code, { group, dot, halo, breaking: c.breaking > 0, weight: c.intensity ?? 0, size })
    }
    this.setSelected(this.selected)
  }

  setSelected(code) {
    this.selected = code
    this.markers.forEach((m, k) => {
      const on = k === code
      m.dot.scale.setScalar(on ? 1.5 : 1)
      m.halo.material.opacity = on ? 0.6 : 0.35
    })
  }

  /** Gira el globo para mostrar un país (animación suave). */
  focus(code) {
    const coords = getCountryCoordinates(code)
    if (!coords) return
    this.controls.autoRotate = false
    const target = latLngToVector3(coords[0], coords[1], this.camera.position.length())
    this.anim = { from: this.camera.position.clone(), to: target, t: 0 }
  }

  pick(e) {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const dots = [...this.markers.values()].map((m) => m.dot)
    const hit = this.raycaster.intersectObjects(dots, false)[0]
    this.onPick?.(hit ? hit.object.userData.code : null)
  }

  /** Posiciones en pantalla de los marcadores (para las etiquetas HTML). */
  project() {
    const rect = this.canvas.getBoundingClientRect()
    const camDir = this.camera.position.clone().normalize()
    const out = []
    this.markers.forEach((m, code) => {
      const world = new THREE.Vector3()
      m.group.getWorldPosition(world)
      const facing = world.clone().normalize().dot(camDir)
      const p = world.clone().project(this.camera)
      out.push({ code, x: ((p.x + 1) / 2) * rect.width, y: ((1 - p.y) / 2) * rect.height, visible: facing > 0.25, weight: m.weight })
    })
    return out
  }

  resize(width, height) {
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / Math.max(1, height)
    this.camera.updateProjectionMatrix()
  }

  loop() {
    const t = this.clock.getElapsedTime()
    if (this.anim) {
      this.anim.t = Math.min(1, this.anim.t + 0.035)
      const k = 1 - Math.pow(1 - this.anim.t, 3)
      this.camera.position.lerpVectors(this.anim.from, this.anim.to, k).setLength(this.anim.from.length())
      if (this.anim.t >= 1) this.anim = null
    }
    if (!this.reducedMotion) {
      this.markers.forEach((m) => {
        if (!m.breaking) return
        const s = 1 + 0.6 * ((t * 0.8) % 1)
        m.halo.scale.setScalar(s)
        m.halo.material.opacity = 0.5 * (1 - ((t * 0.8) % 1))
      })
    }
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    this.onFrame?.()
    this.frame = requestAnimationFrame(this.loop)
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.canvas.removeEventListener('pointerdown', this.handleDown)
    this.canvas.removeEventListener('pointerup', this.handleUp)
    this.controls.dispose()
    this.scene.traverse((o) => {
      o.geometry?.dispose?.()
      o.material?.dispose?.()
    })
    this.dotTex.dispose()
    this.renderer.dispose()
  }
}
