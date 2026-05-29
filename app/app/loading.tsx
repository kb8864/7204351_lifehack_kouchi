export default function HomeLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8 animate-pulse">
      <div className="text-center py-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-32 mx-auto" />
        <div className="h-7 bg-gray-200 rounded w-48 mx-auto" />
        <div className="h-3 bg-gray-200 rounded w-64 mx-auto" />
      </div>
      <div className="h-12 bg-gray-200 rounded-2xl" />
      <div>
        <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
