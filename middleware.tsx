import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    console.log('Middleware - Path:', pathname)
    console.log('Middleware - Token exists:', !!token)

    // Admin routes - require specific role (extend this logic)
    if (pathname.startsWith('/admin')) {
      // Add role checking logic here
      // if (token?.role !== 'admin') {
      //   return NextResponse.redirect(new URL('/unauthorized', req.url))
      // }
    }

    // API routes protection
    if (pathname.startsWith('/api/protected')) {
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to login page
        if (pathname === '/login') return true
        
        // Require token for protected routes
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    // Protected pages
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    
    // Protected API routes
    '/api/protected/:path*',
    '/api/user/:path*',
    
    // Allow login page
    '/login'
  ]
}