export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#002244]">
      <div className="flex flex-col items-center space-y-4 animate-pulse">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-white font-bold text-2xl">
          MF
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Max Facility
        </h1>
        <p className="text-sm text-white/50">Loading...</p>
      </div>
    </div>
  )
}
