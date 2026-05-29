export default function CategoryLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 animate-pulse">
      <div className="flex gap-2 items-center">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-28 bg-gray-200 rounded-2xl" />
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="h-10 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
            <div className="h-36 bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="flex gap-1">
                <div className="h-4 w-10 bg-gray-200 rounded-full" />
                <div className="h-4 w-10 bg-gray-200 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
