export default function CategoryLoading() {
  return (
    <>
      <div className="page-loader" />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex gap-2 items-center">
          <div className="sk h-4 w-12 rounded-full" />
          <div className="sk h-4 w-3 rounded-full" />
          <div className="sk h-4 w-20 rounded-full" />
        </div>
        <div className="sk h-28 rounded-2xl" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="sk h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="sk h-10 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
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
