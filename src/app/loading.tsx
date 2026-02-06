export default function Loading() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Max Facility</h1>
        <p className="text-wolf-grey mt-2">Loading...</p>
        <div className="mt-4 animate-pulse">
          <div className="h-1 w-32 mx-auto bg-action-green rounded" />
        </div>
      </div>
    </div>
  )
}
