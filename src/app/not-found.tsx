import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[color:var(--bg-0)]">
      <div className="text-center max-w-md mx-auto p-8">
        <p className="text-6xl font-bold font-mono tabular-nums text-[color:var(--accent)] mb-4">
          404
        </p>
        <h1 className="text-xl font-semibold text-[color:var(--text-0)] mb-2">
          Page not found
        </h1>
        <p className="text-[color:var(--text-1)] mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard" className="btn-primary inline-block">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
