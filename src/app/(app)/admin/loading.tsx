export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Table / list skeleton */}
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="hidden sm:block h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-0 dark:border-slate-800/50"
          >
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="hidden sm:block h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="ml-auto h-8 w-20 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
