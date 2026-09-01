import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the user has the refresh token cookie
  const refreshToken = request.cookies.get('kharchyapani_refresh_token');

  // If no token exists and they are trying to access protected routes
  if (!refreshToken) {
    // Redirect to login page immediately
    return NextResponse.redirect(new URL('/login', request.url));
  }

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
