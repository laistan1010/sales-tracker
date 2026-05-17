import { prisma } from "@/lib/db";
import { loginAs } from "./actions";
import { BarChart3 } from "lucide-react";

export default async function LoginPage() {
  const users = await prisma.user.findMany({ orderBy: { role: "asc" } });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Sales Tracker</h1>
          <p className="text-sm text-muted-foreground">選擇測試帳號登入</p>
        </div>

        {/* User cards */}
        <div className="space-y-3">
          {users.map((user) => (
            <form key={user.id} action={loginAs}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:border-foreground hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-lg font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.role === "ADMIN" ? "管理員 · Admin" : "銷售員 · Sales"}
                    </p>
                  </div>
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </button>
            </form>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          測試模式 · 無需密碼
        </p>
      </div>
    </div>
  );
}
