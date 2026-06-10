export default function HomeLoading() {
  return (
    <>
      <div className="page-loader" />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <div className="text-center py-4 space-y-2">
          <div className="sk h-3 w-32 mx-auto rounded-full" />
          <div className="sk h-7 w-48 mx-auto rounded-full mt-2" />
        </div>
        <div className="sk h-12 rounded-2xl" />
        <div>
          <div className="sk h-5 w-32 rounded-full mb-3" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="sk shrink-0 w-52 h-40 rounded-2xl" />
            ))}
          </div>
        </div>
        <div>
          <div className="sk h-5 w-48 rounded-full mb-3" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="sk h-12 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
