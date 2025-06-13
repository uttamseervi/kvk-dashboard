// import { NextAuthOptions, Session, User } from 'next-auth';
// import CredentialsProvider from 'next-auth/providers/credentials';
// import { compare } from 'bcryptjs';
// import prisma from '@/lib/prisma-client';

// // Extend the User type to include role
// declare module 'next-auth' {
//     interface User {
//         role?: string;
//     }

//     interface Session {
//         user: {
//             id: string;
//             name?: string | null;
//             email?: string | null;
//             image?: string | null;
//             role?: string | null;
//         };
//     }
// }

// export const authOptions: NextAuthOptions = {
//     providers: [
//         CredentialsProvider({
//             id: 'credentials',
//             name: 'Credentials',
//             credentials: {
//                 email: { label: 'Email', type: 'text' },
//                 password: { label: 'Password', type: 'password' },
//             },
//             async authorize(credentials) {
//                 if (!credentials?.email || !credentials?.password) {
//                     throw new Error('Email and password required');
//                 }

//                 const user = await prisma.user.findUnique({
//                     where: {
//                         email: credentials.email,
//                     },
//                 });

//                 if (!user || !user.password) {
//                     throw new Error('Email does not exist');
//                 }

//                 const isCorrectPassword = await compare(
//                     credentials.password,
//                     user.password
//                 );

//                 if (!isCorrectPassword) {
//                     throw new Error('Incorrect password');
//                 }

//                 return {
//                     id: user.id.toString(),
//                     email: user.email,
//                     name: user.name,
//                     role: user.role,
//                 };
//             },
//         }),
//     ],
//     pages: {
//         signIn: '/',
//         error: '/',
//     },
//     session: {
//         strategy: 'jwt',
//         maxAge: 30 * 24 * 60 * 60, // 30 days
//     },
//     // 🔥 Critical: Configure cookies for cross-origin
//     cookies: {
//         sessionToken: {
//             name: process.env.NODE_ENV === 'production'
//                 ? '__Secure-next-auth.session-token'
//                 : 'next-auth.session-token',
//             options: {
//                 httpOnly: true,
//                 sameSite: 'none', // 🔥 Required for cross-origin
//                 secure: process.env.NODE_ENV === 'production', // 🔥 Must be true in production
//                 path: '/',
//                 // Don't set domain for Vercel - let it default
//             },
//         },
//         callbackUrl: {
//             name: process.env.NODE_ENV === 'production'
//                 ? '__Secure-next-auth.callback-url'
//                 : 'next-auth.callback-url',
//             options: {
//                 sameSite: 'none',
//                 secure: process.env.NODE_ENV === 'production',
//                 path: '/',
//             }
//         },
//         csrfToken: {
//             name: process.env.NODE_ENV === 'production'
//                 ? '__Host-next-auth.csrf-token'
//                 : 'next-auth.csrf-token',
//             options: {
//                 httpOnly: true,
//                 sameSite: 'none',
//                 secure: process.env.NODE_ENV === 'production',
//                 path: '/',
//             }
//         }
//     },
//     callbacks: {
//         async jwt({ token, user }) {
//             if (user) {
//                 token.id = user.id;
//                 token.role = user.role;
//             }
//             return token;
//         },
//         async session({ session, token }) {
//             if (token && session.user) {
//                 session.user.id = token.id as string;
//                 session.user.role = token.role as string;
//             }
//             return session;
//         },
//     },
//     debug: process.env.NODE_ENV === 'development',
// };

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma-client';

// Extend the User type to include role
declare module 'next-auth' {
    interface User {
        role?: string;
    }

    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: string | null;
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log('🔐 Authorize called with email:', credentials?.email);

                if (!credentials?.email || !credentials?.password) {
                    return null; // Return null instead of throwing error
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    });

                    if (!user || !user.password) {
                        console.log('❌ User not found');
                        return null;
                    }

                    const isCorrectPassword = await compare(
                        credentials.password,
                        user.password
                    );

                    if (!isCorrectPassword) {
                        console.log('❌ Incorrect password');
                        return null;
                    }

                    console.log('✅ Authentication successful');
                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                } catch (error) {
                    console.error('💥 Auth error:', error);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: '/',
    },
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    debug: true,
};