'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 animate-ping" />
          <div className="w-16 h-16 rounded-full border-2 border-t-sky-400 border-r-transparent border-b-sky-500 border-l-transparent animate-spin shadow-lg shadow-sky-500/20" />
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse tracking-wide">
          Verifying session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md w-full border border-slate-700/60 shadow-2xl space-y-5">
          <div className="p-3.5 rounded-2xl bg-sky-500/10 text-sky-400 w-fit mx-auto border border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Sign In to KharchyaPani</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Please sign in or create an account to access your personalized expense analytics, budgets, and Kharcha AI.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="btn-primary text-xs flex-1 py-2.5 justify-center flex items-center gap-1.5"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/register"
              className="btn-secondary text-xs flex-1 py-2.5 justify-center flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
