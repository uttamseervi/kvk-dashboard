# NextAuth Cookie Configuration Troubleshooting Guide

## The Problem: Login Success but Redirect Loop

### Symptoms
- Authentication appears successful (POST `/api/auth/callback/credentials` returns 200)
- User gets redirected back to login page instead of dashboard
- Logs show: `GET /?callbackUrl=http%3A%2F%2Flocalhost%3A3001 200`
- Creates infinite redirect loop

### Root Cause: Cookie `sameSite` Configuration

The issue occurs when `sameSite: 'none'` is used in development environment:

```typescript
// ❌ PROBLEMATIC CONFIGURATION
cookies: {
    sessionToken: {
        options: {
            sameSite: 'none', // This breaks localhost development
        }
    }
}
```

## Why This Happens

1. **`sameSite: 'none'`** is designed for cross-origin requests
2. **In development (localhost)**, browsers prevent cookies with `sameSite: 'none'` from being saved
3. **Authentication succeeds** but **session cookie isn't stored**
4. **NextAuth can't find the session** → redirects back to login
5. **Creates redirect loop**

## The Solution

### Environment-Specific Cookie Configuration

```typescript
// ✅ CORRECT CONFIGURATION
cookies: {
    sessionToken: {
        name: process.env.NODE_ENV === 'production'
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token',
        options: {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ Key fix
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        },
    },
    callbackUrl: {
        name: process.env.NODE_ENV === 'production'
            ? '__Secure-next-auth.callback-url'
            : 'next-auth.callback-url',
        options: {
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ Key fix
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        }
    },
    csrfToken: {
        name: process.env.NODE_ENV === 'production'
            ? '__Host-next-auth.csrf-token'
            : 'next-auth.csrf-token',
        options: {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ Key fix
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        }
    }
}
```

## Complete Working NextAuth Configuration

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma-client';

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
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email },
                    });

                    if (!user || !user.password) {
                        return null;
                    }

                    const isCorrectPassword = await compare(
                        credentials.password,
                        user.password
                    );

                    if (!isCorrectPassword) {
                        return null;
                    }

                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
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
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production'
                ? '__Secure-next-auth.session-token'
                : 'next-auth.session-token',
            options: {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
            },
        },
        callbackUrl: {
            name: process.env.NODE_ENV === 'production'
                ? '__Secure-next-auth.callback-url'
                : 'next-auth.callback-url',
            options: {
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
            }
        },
        csrfToken: {
            name: process.env.NODE_ENV === 'production'
                ? '__Host-next-auth.csrf-token'
                : 'next-auth.csrf-token',
            options: {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
            }
        }
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
    debug: process.env.NODE_ENV === 'development',
};
```

## Cookie SameSite Values Explained

| Value | Use Case | Description |
|-------|----------|-------------|
| `'lax'` | **Development/Same-origin** | Allows cookies on same-site requests. Perfect for localhost development. |
| `'strict'` | **High Security** | Only sends cookies on same-site requests. Very restrictive. |
| `'none'` | **Cross-origin/Production** | Allows cookies on cross-origin requests. Requires `secure: true`. |

## Mental Model

Think of `sameSite` like shipping policies:

- 🏠 **`'lax'` (Development)**: Like a friendly neighborhood - cookies are shared easily within localhost
- 🌐 **`'none'` (Production)**: Like international shipping - needs special permissions for cross-domain cookie delivery

## Debugging Steps

### 1. Check Browser Network Tab
- Look for successful POST to `/api/auth/callback/credentials`
- Check if cookies are being set in Response Headers

### 2. Add Debug Logging
```typescript
async authorize(credentials) {
    console.log('🔐 Authorize called with:', credentials?.email);
    // ... your auth logic
    console.log('✅ Returning user:', userObject);
    return userObject;
}
```

### 3. Clear Browser Data
After fixing configuration:
- Clear cookies and local storage
- Restart development server
- Test login flow again

## Common Mistakes to Avoid

❌ **Don't use `sameSite: 'none'` in development**
❌ **Don't throw errors in `authorize()` - return `null` instead**
❌ **Don't forget to restart dev server after config changes**
❌ **Don't forget to clear browser cookies when testing**

✅ **Do use environment-specific cookie settings**
✅ **Do add debug logging during development**
✅ **Do return proper user objects from `authorize()`**
✅ **Do test in incognito mode to avoid cached cookies**

## Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3001
NODE_ENV=development
```

## Why This Issue is So Common

1. **Not obvious**: Authentication appears to work (200 responses)
2. **Misleading logs**: No clear error indicating cookie issues
3. **Environment-specific**: Works differently in dev vs production
4. **Browser security**: Modern browsers are strict about cross-origin cookies
5. **Documentation**: Easy to copy production configs for development

## Quick Fix for Testing

If you want to quickly test without complex cookie configuration:

```typescript
export const authOptions: NextAuthOptions = {
    // ... your providers
    session: { strategy: 'jwt' },
    pages: { signIn: '/' },
    // Remove cookies configuration entirely - let NextAuth use defaults
    debug: true,
};
```

NextAuth will use sensible defaults that work in development.

---

**Remember**: This is a very common issue that trips up many developers. The key is understanding that cookie behavior differs between development and production environments!