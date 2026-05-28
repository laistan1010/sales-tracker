"use client";

import { useActionState, useState } from "react";
import { BarChart3, Lock, Eye, EyeOff } from "lucide-react";
import { loginAs } from "./actions";

interface User {
  id:           string;
  name:         string;
  role:         string;
  requiresPass: boolean;
}

const initial: { error?: string } = {};

export function LoginClient({ users }: { users: User[] }) {
  const [selected,    setSelected]    = useState<User | null>(null);
  const [showPass,    setShowPass]    = useState(false);
  const [state, formAction, pending]  = useActionState(loginAs, initial);

  function handleCardClick(user: User) {
    if (user.requiresPass) {
      setSelected(user);
      setShowPass(false);
    }
    // No-password users submit immediately via their own form
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Sales Tracker</h1>
          <p className="text-sm text-muted-foreground">選擇帳號登入</p>
        </div>

        {/* User cards */}
        <div className="space-y-3">
          {users.map((user) =>
            user.requiresPass ? (
              /* Protected account — click to open password form */
              <button
                key={user.id}
                type="button"
                onClick={() => handleCardClick(user)}
                className="w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:border-foreground hover:shadow-md active:scale-[0.98]"
              >
                <UserRow user={user} />
              </button>
            ) : (
              /* No password — direct submit */
              <form key={user.id} action={formAction}>
                <input type="hidden" name="userId"   value={user.id} />
                <input type="hidden" name="password" value="" />
                <button
                  type="submit"
                  className="w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:border-foreground hover:shadow-md active:scale-[0.98]"
                >
                  <UserRow user={user} />
                </button>
              </form>
            )
          )}
        </div>

        {/* Password modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl space-y-5">

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-lg font-bold">
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    需要密碼
                  </p>
                </div>
              </div>

              {/* Password form */}
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="userId" value={selected.id} />

                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    placeholder="輸入密碼"
                    autoFocus
                    className="w-full rounded-xl border bg-muted px-4 py-3 pr-12 text-sm outline-none focus:border-foreground focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {state.error && (
                  <p className="text-sm text-red-500 font-medium">{state.error}</p>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full h-12 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-90 active:opacity-80 disabled:opacity-50 transition-opacity"
                  >
                    {pending ? "登入中…" : "登入"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelected(null); }}
                    className="w-full h-12 rounded-xl border font-semibold text-sm hover:bg-muted transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-lg font-bold">
        {user.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {user.requiresPass && <Lock className="h-3 w-3" />}
          {user.role === "ADMIN" ? "管理員 · Admin" : "銷售員 · Sales"}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
      }`}>
        {user.role}
      </span>
    </div>
  );
}
