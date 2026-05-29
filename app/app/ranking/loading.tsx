export default function RankingLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-pulse">
      <div className="text-center space-y-2">
        <div className="h-10 w-10 bg-gray-200 rounded-full mx-auto" />
        <div className="h-6 bg-gray-200 rounded w-40 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-56 mx-auto" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
