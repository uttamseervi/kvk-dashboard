import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://kvk-main.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
}

export default withAuth(
    async function middleware(req: NextRequestWithAuth) {
        // Handle CORS preflight requests for API routes first
        if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
            return new NextResponse(null, {
                status: 200,
                headers: corsHeaders,
            })
        }

        // Add CORS headers to API responses
        if (req.nextUrl.pathname.startsWith('/api/')) {
            const response = NextResponse.next()

            // Add CORS headers
            Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value)
            })

            return response
        }

        const token = await getToken({ req })
        const isAuth = !!token
        const isAuthPage = req.nextUrl.pathname === '/'

        console.log('Middleware - Path:', req.nextUrl.pathname, 'IsAuth:', isAuth) // Debug log

        // If user is on login page and is authenticated, redirect to dashboard
        if (isAuthPage && isAuth) {
            console.log('Redirecting authenticated user to dashboard') // Debug log
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        // If user is not authenticated and trying to access protected routes, redirect to login
        if (!isAuth && !isAuthPage) {
            console.log('Redirecting unauthenticated user to login') // Debug log
            return NextResponse.redirect(new URL('/', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Always allow OPTIONS requests
                if (req.method === 'OPTIONS') {
                    return true
                }

                // Allow all API routes (they handle their own auth if needed)
                if (req.nextUrl.pathname.startsWith('/api/')) {
                    return true
                }

                // Allow access to auth pages without token
                if (req.nextUrl.pathname === '/') {
                    return true
                }

                // Require token for all other pages
                return !!token
            }
        },
        pages: {
            signIn: '/'
        }
    }
)

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
    ],
}