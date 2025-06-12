import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'

export default withAuth(
    async function middleware(req: NextRequestWithAuth) {
        // Handle CORS for cross-origin requests
        const response = NextResponse.next()

        // Set CORS headers for your static site
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 200, headers: response.headers })
        }

        const token = await getToken({ req })
        const isAuth = !!token
        const isAuthPage = req.nextUrl.pathname === '/'
        const isApiRoute = req.nextUrl.pathname.startsWith('/api')

        // Skip auth checks for API routes - handle them separately
        if (isApiRoute) {
            return response
        }

        if (isAuthPage) {
            if (isAuth) {
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }
            return null
        }

        if (!isAuth) {
            let callbackUrl = req.nextUrl.pathname
            if (req.nextUrl.search) {
                callbackUrl += req.nextUrl.search
            }

            const encodedCallbackUrl = encodeURIComponent(callbackUrl)
            return NextResponse.redirect(
                new URL(`/?callbackUrl=${encodedCallbackUrl}`, req.url)
            )
        }

        return response
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow API routes to pass through - they'll handle their own auth
                if (req.nextUrl.pathname.startsWith('/api')) {
                    return true
                }
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
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
}