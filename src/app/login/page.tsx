import { prisma } from "@/lib/db";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const users = await prisma.user.findMany({
    orderBy: { role: "asc" },
    select: { id: true, name: true, role: true, passwordHash: true },
  });

  const clientUsers = users.map(u => ({
    id:           u.id,
    name:         u.name,
    role:         u.role,
    requiresPass: !!u.passwordHash,
  }));

  return <LoginClient users={clientUsers} />;
}
