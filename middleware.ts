import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'

export default withAuth(
    async function middleware(req: NextRequestWithAuth) {
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