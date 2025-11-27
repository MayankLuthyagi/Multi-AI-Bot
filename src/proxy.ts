import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const sessionCookie = request.cookies.get('user_session');
    const { pathname } = request.nextUrl;

    // Protected routes
    const protectedRoutes = ['/dashboard', '/profile', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // If trying to access protected route without session, redirect to login
    if (isProtectedRoute && !sessionCookie) {
        const loginUrl = new URL('/', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If logged in and trying to access login page, redirect to dashboard
    if (pathname === '/' && sessionCookie) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
