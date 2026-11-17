/** Esqueleto de portada con la misma geometría que el contenido final. */
export default function DigestSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4 py-6">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-4/5" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
        <div className="skeleton aspect-[4/3.4] rounded-2xl" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="skeleton aspect-[16/9] rounded-none" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-6 w-full" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
