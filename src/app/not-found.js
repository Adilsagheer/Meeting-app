import Link from "next/link";

// Custom not-found page for unmatched routes
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-8 text-lg text-zinc-500">Sorry, the page you are looking for does not exist.</p>
      <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Go Home</Link>
    </div>
  );
}
