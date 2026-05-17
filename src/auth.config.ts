import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config — no DB imports.
 * Used by middleware for lightweight JWT verification.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname.startsWith("/login");

      if (isLoginPage) {
        // Redirect already-authenticated users away from login
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      // All other routes require authentication
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
