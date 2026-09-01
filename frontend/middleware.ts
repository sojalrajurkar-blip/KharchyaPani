import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Routes are secured client-side via AuthGuard & JWT in Authorization header
  return NextResponse.next();
}

// Specify the paths where this middleware should run
export const config = {
  matcher: [
    /*
     * Match all protected routes:
     * - Root (/)
     * - /expenses, /expenses/*
     * - /categories, /categories/*
     * - /budgets, /budgets/*
     */
    '/',
    '/expenses/:path*',
    '/categories/:path*',
    '/budgets/:path*',
  ],
};
