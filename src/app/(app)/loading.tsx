export default function AppLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header area skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
