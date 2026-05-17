import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Instantiate a lightweight NextAuth with only the Edge-safe config.
// This avoids importing Prisma / Node.js modules in Edge middleware.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Protect every route except Next.js internals and the auth API
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
