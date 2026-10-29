export default function Loading() {
  return (
    <div className="p-4 space-y-4" role="status" aria-label="Loading">
      <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-slate-800 animate-pulse" />
      <div className="h-32 rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse" />
      <div className="h-16 rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse" />
      <div className="h-16 rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse" />
      <div className="h-16 rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
