import { cn } from '@/lib/utils'

/**
 * Capa de profundidad de fondo: dos orbes muy tenues (terracota y cian mineral)
 * y un velo superior. Decorativa, fija y sin interacción.
 */
export default function StageAtmosphere({ className }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}>
      <div
        className="absolute -right-40 -top-48 h-[38rem] w-[38rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--orb-1), transparent 65%)' }}
      />
      <div
        className="absolute -bottom-56 -left-40 h-[42rem] w-[42rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--orb-2), transparent 65%)' }}
      />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/60 to-transparent" />
    </div>
  )
}
