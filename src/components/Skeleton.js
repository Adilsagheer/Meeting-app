// Simple skeleton loader for forms and dashboard
export default function Skeleton({ type }) {
  if (type === "form") {
    return (
      <div className="max-w-sm mx-auto mt-10 p-6 bg-white dark:bg-zinc-900 rounded shadow animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
        <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-1/3" />
      </div>
    );
  }
  if (type === "dashboard") {
    return (
      <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col items-center animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded w-1/2 mb-6" />
        <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-full mb-4" />
        <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-full mb-2" />
        <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
      </div>
    );
  }
  if (type === "meeting") {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-900 dark:to-zinc-800">
        <section className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-1/3 mb-4 animate-pulse" />
          <div className="w-full max-w-lg bg-gray-200 dark:bg-zinc-700 rounded aspect-video mb-4 animate-pulse" />
          <div className="flex gap-2 mb-4">
            <div className="h-10 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </section>
        <aside className="w-full md:w-80 bg-white dark:bg-zinc-900 p-4 flex flex-col shadow-lg border-l border-gray-200 dark:border-zinc-800 animate-pulse">
          <div className="flex-1 space-y-2 mb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-5/6" />
            ))}
          </div>
          <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
        </aside>
      </div>
    );
  }
  return null;
}
