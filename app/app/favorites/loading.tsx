export default function FavoritesLoading() {
  return (
    <>
      <div className="page-loader" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="sk h-7 w-40 rounded-full" />
        <div className="sk h-4 w-24 rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-[var(--border)]">
              <div className="sk h-36" style={{ borderRadius: 0 }} />
              <div className="p-3 space-y-2">
                <div className="sk h-4 w-full rounded-full" />
                <div className="sk h-3 w-2/3 rounded-full" />
                <div className="flex gap-1">
                  <div className="sk h-4 w-10 rounded-full" />
                  <div className="sk h-4 w-10 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
