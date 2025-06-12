import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'

export default withAuth(
    async function middleware(req: NextRequestWithAuth) {
        const token = await getToken({ req })
        const isAuth = !!token
        const isAuthPage = req.nextUrl.pathname === '/'

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
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
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
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
} 