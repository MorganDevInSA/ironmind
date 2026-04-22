'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[color:color-mix(in_srgb,var(--bad)_12%,transparent)] flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-[color:var(--bad)]" />
        </div>
        <h2 className="text-xl font-semibold text-[color:var(--text-0)] mb-2">
          Something went wrong
        </h2>
        <p className="text-[color:var(--text-1)] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button onClick={reset} className="btn-primary inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
