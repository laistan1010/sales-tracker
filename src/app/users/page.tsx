import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ShieldAlert } from "lucide-react";

export default async function UsersPage() {
  const session = await auth();
  const isAdmin = session!.user.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-lg font-bold">權限不足</h1>
          <p className="text-sm text-muted-foreground mt-1">
            只有管理員可以查看此頁面
          </p>
        </div>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { leads: true } },
      leads: { select: { status: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">團隊成員</h1>
      <ul className="space-y-3">
        {users.map((user) => {
          const wonCount  = user.leads.filter((l) => l.status === "CLOSED_WON").length;
          const activeCount = user.leads.filter((l) => l.status === "DEMO" || l.status === "OBJECTION").length;

          return (
            <li
              key={user.id}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{user.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role === "ADMIN" ? "管理員" : "銷售員"}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>共 <strong className="text-foreground">{user._count.leads}</strong> 商戶</span>
                    <span>成交 <strong className="text-green-600">{wonCount}</strong></span>
                    <span>進行中 <strong className="text-yellow-600">{activeCount}</strong></span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
