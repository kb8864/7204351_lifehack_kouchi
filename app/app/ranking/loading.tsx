export default function RankingLoading() {
  return (
    <>
      <div className="page-loader" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="sk h-10 w-10 rounded-full mx-auto" />
          <div className="sk h-6 w-40 rounded-full mx-auto" />
          <div className="sk h-4 w-56 rounded-full mx-auto" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="sk h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    </>
  )
}
