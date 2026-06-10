export default function LifehackLoading() {
  return (
    <>
      <div className="page-loader" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 items-center mb-4">
          <div className="sk h-4 w-12 rounded-full" />
          <div className="sk h-4 w-3 rounded-full" />
          <div className="sk h-4 w-20 rounded-full" />
        </div>
        <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E5EA]">
          <div className="sk h-52" style={{ borderRadius: 0 }} />
          <div className="p-5 space-y-4">
            <div className="sk h-7 w-3/4 rounded-xl" />
            <div className="sk h-4 w-32 rounded-full" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="sk h-5 w-16 rounded-full" />
              ))}
            </div>
            <div className="rounded-xl p-4 space-y-2 bg-gray-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`sk h-4 rounded-full ${i === 4 ? 'w-2/3' : 'w-full'}`} />
              ))}
            </div>
            <div className="sk h-11 rounded-xl" />
            <div className="flex items-center pt-2 border-t border-gray-100">
              <div className="sk h-9 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
