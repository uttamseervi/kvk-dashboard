import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'

export default withAuth(
    async function middleware(req: NextRequestWithAuth) {
        const token = await getToken({ req })
        const isAuth = !!token
        const isAuthPage = req.nextUrl.pathname === '/'
        const isApiRoute = req.nextUrl.pathname.startsWith('/api')

        // Skip auth checks for API routes (including NextAuth API routes)
        if (isApiRoute) {
            return NextResponse.next()
        }

        // Allow the login page and NextAuth pages to load without redirect
        if (isAuthPage) {
            // Only redirect to dashboard if user is authenticated AND not coming from a callback
            if (isAuth && !req.nextUrl.searchParams.has('callbackUrl')) {
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }
            return NextResponse.next()
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

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Always allow auth pages and API routes
                if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/api')) {
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