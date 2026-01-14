
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isLoginPage = nextUrl.pathname === '/login';
            const isForgotPassword = nextUrl.pathname.startsWith('/forgot-password') || nextUrl.pathname.startsWith('/reset-password');
            const isPublicAsset = nextUrl.pathname.includes('.'); // Simple check for assets like .png, .css

            if (isPublicAsset) return true;

            if (isLoginPage || isForgotPassword) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
                return true;
            }

            if (!isLoggedIn) {
                return false; // Redirect to /login
            }

            return true;
        },
        async session({ session, token }: any) {
            // Add role to session
            if (token?.role && session.user) {
                session.user.role = token.role;
            }
            return session;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
            }
            return token;
        }
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
