import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="glass-card p-8 text-center max-w-md w-full border border-slate-700/50 shadow-2xl space-y-4">
        <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 w-fit mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">404 - Page Not Found</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="btn-primary text-xs w-full py-2.5 justify-center flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
