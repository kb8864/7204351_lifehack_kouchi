export default function LifehackLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse">
      <div className="flex gap-2 items-center mb-4">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E5EA]">
        <div className="h-52 bg-gray-200" />
        <div className="p-5 space-y-4">
          <div className="h-7 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-5 w-16 bg-gray-200 rounded-full" />
            ))}
          </div>
          <div className="space-y-2 bg-gray-50 rounded-xl p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-4 bg-gray-200 rounded ${i === 4 ? 'w-2/3' : 'w-full'}`} />
            ))}
          </div>
          <div className="h-11 bg-gray-200 rounded-xl" />
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="h-9 w-24 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
