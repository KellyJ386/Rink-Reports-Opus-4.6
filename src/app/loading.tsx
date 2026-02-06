export default function Loading() {
  return (
    <div className="min-h-screen bg-navy dark:bg-navy-dark flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Max Facility</h1>
        <p className="text-wolf-grey mt-1 text-sm">Rink Reports</p>
        <div className="mt-6 flex justify-center">
          <div className="h-1 w-32 bg-action-green/30 rounded overflow-hidden">
            <div className="h-full w-1/2 bg-action-green rounded animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  )
}
