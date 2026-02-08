import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/dashboard', '/create', '/evaluations'];
const CANDIDATE_ROUTES = ['/interview'];
const PUBLIC_ROUTES = ['/', '/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
  const isCandidateRoute = CANDIDATE_ROUTES.some(route => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route);
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  if (isAdminRoute) {
    const authToken = request.cookies.get('auth_token')?.value;
    const adminSecret = process.env.ADMIN_SECRET;
    
    if (!authToken || authToken !== adminSecret) {
      const url = new URL('/login', request.url);
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }
  
  if (isCandidateRoute) {
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (authToken) {
      const url = new URL('/', request.url);
      url.searchParams.set('message', 'admin_redirect');
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/create/:path*', '/evaluations/:path*', '/interview/:path*']
};
