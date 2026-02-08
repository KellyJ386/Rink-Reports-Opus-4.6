export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg border-0 bg-white p-8 shadow-lg dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-6">
          {/* Brand logo placeholder */}
          <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-32 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-52 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

          {/* Form field placeholders */}
          <div className="w-full space-y-5 pt-2">
            {/* Email field */}
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-11 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-11 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Remember me + forgot password row */}
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Submit button */}
            <div className="h-11 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Footer text */}
          <div className="h-3 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
