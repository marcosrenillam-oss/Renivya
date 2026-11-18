/** Fondo vivo: tres luces difusas que derivan despacio, con grano de papel por encima. */
export default function Aurora() {
  const blob = 'aurora-blob absolute rounded-full blur-[70px] will-change-transform'
  return (
    <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className={blob} style={{ width: '75vmax', height: '75vmax', left: '-25vmax', top: '-30vmax', background: 'radial-gradient(circle, var(--aurora-1), transparent 65%)', animation: 'aurora-a 26s ease-in-out infinite' }} />
      <div className={blob} style={{ width: '65vmax', height: '65vmax', right: '-28vmax', top: '18vh', background: 'radial-gradient(circle, var(--aurora-2), transparent 65%)', animation: 'aurora-b 32s ease-in-out infinite' }} />
      <div className={blob} style={{ width: '60vmax', height: '60vmax', left: '-10vmax', bottom: '-32vmax', background: 'radial-gradient(circle, var(--aurora-3), transparent 65%)', animation: 'aurora-c 38s ease-in-out infinite' }} />
    </div>
  )
}
