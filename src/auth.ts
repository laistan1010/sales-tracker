import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { userId: {} },
      async authorize(credentials) {
        const userId = credentials?.userId as string | undefined;
        if (!userId) return null;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;

        return { id: user.id, name: user.name, role: user.role };
      },
    }),
  ],
});
