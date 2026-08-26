'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled client error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="glass-card p-8 text-center max-w-md w-full border border-slate-700/50 shadow-2xl space-y-4">
        <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Something Went Wrong</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error?.message || 'An unexpected rendering error occurred. Please click retry.'}
        </p>
        <button
          onClick={() => reset()}
          className="btn-primary text-xs w-full py-2.5 justify-center flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  );
}
