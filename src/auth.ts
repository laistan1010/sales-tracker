import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: { userId: {}, password: {} },
      async authorize(credentials) {
        const userId   = credentials?.userId   as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!userId) return null;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;

        // If account has a password, verify it
        if (user.passwordHash) {
          if (!password) return null;
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;
        }

        return { id: user.id, name: user.name, role: user.role };
      },
    }),
  ],
});
