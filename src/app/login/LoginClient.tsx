"use client";

import { useActionState, useState } from "react";
import { BarChart3, KeyRound, Eye, EyeOff, ChevronRight } from "lucide-react";
import { loginAs } from "./actions";

interface User {
  id:           string;
  name:         string;
  role:         string;
  requiresPass: boolean;
}

const initial: { error?: string } = {};

export function LoginClient({ users }: { users: User[] }) {
  const [selected,   setSelected]   = useState<User | null>(null);
  const [showPass,   setShowPass]   = useState(false);
  const [state, formAction, pending] = useActionState(loginAs, initial);

  const adminUsers = users.filter(u => u.role === "ADMIN");
  const salesUsers = users.filter(u => u.role === "SALES");

  function handleCardClick(user: User) {
    if (user.requiresPass) {
      setSelected(user);
      setShowPass(false);
    }
  }

  function UserCard({ user }: { user: User }) {
    const inner = (
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-black text-sm ${
          user.role === "ADMIN"
            ? "bg-[var(--brand)] text-black"
            : "bg-foreground text-background"
        }`}>
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{user.name}</p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            {user.role === "ADMIN" ? "管理員" : "銷售員"}
            {user.requiresPass && (
              <span className="ml-1.5 inline-flex items-center gap-0.5">
                <KeyRound className="h-2.5 w-2.5" />
                需要密碼
              </span>
            )}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    );

    const cardClass =
      "w-full rounded-lg border bg-card px-4 py-3 text-left transition-all hover:border-foreground/30 hover:bg-accent active:scale-[0.98]";

    if (user.requiresPass) {
      return (
        <button type="button" onClick={() => handleCardClick(user)} className={cardClass}>
          {inner}
        </button>
      );
    }

    return (
      <form action={formAction}>
        <input type="hidden" name="userId"   value={user.id} />
        <input type="hidden" name="password" value="" />
        <button type="submit" className={cardClass}>{inner}</button>
      </form>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-80 border-r px-8 py-10 bg-muted/30">
        <div>
          <div className="flex items-center gap-2.5 mb-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] shadow-[0_0_24px_var(--brand)]">
              <BarChart3 className="h-4 w-4 text-black" />
            </div>
            <span className="font-bold tracking-tight">Sales Tracker</span>
          </div>
          <h2 className="text-2xl font-bold leading-snug text-foreground">
            業績盡在<br />掌握之中
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            追蹤商戶進度<br />記錄每一次接觸<br />分析銷售業績
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Koo Yuet Tech &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* Right: account selection */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] shadow-[0_0_20px_var(--brand)]">
            <BarChart3 className="h-4 w-4 text-black" />
          </div>
          <span className="font-bold tracking-tight">Sales Tracker</span>
        </div>

        <div className="w-full max-w-xs space-y-6">

          {/* Admin accounts */}
          {adminUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
                管理員
              </p>
              <div className="space-y-1.5">
                {adminUsers.map(user => <UserCard key={user.id} user={user} />)}
              </div>
            </div>
          )}

          {/* Divider */}
          {adminUsers.length > 0 && salesUsers.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase">銷售員</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {/* Sales accounts */}
          {salesUsers.length > 0 && (
            <div className="space-y-1.5">
              {salesUsers.map(user => <UserCard key={user.id} user={user} />)}
            </div>
          )}

        </div>
      </div>

      {/* Password modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xs rounded-xl border bg-background p-6 shadow-2xl space-y-5">

            {/* User header */}
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-black text-sm ${
                selected.role === "ADMIN" ? "bg-[var(--brand)] text-black" : "bg-foreground text-background"
              }`}>
                {selected.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-sm">{selected.name}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  輸入密碼以繼續
                </p>
              </div>
            </div>

            {/* Password form */}
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="userId" value={selected.id} />

              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="密碼"
                  autoFocus
                  className="w-full rounded-lg border bg-muted px-4 py-2.5 pr-10 text-sm outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {state.error && (
                <p className="text-xs text-destructive font-medium">{state.error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex-1 h-10 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 h-10 rounded-lg bg-[var(--brand)] text-black text-sm font-bold hover:opacity-90 active:opacity-80 disabled:opacity-50 transition-opacity"
                >
                  {pending ? "登入中…" : "登入"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
