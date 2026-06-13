import Link from "next/link";
import { BarChart3, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLinks } from "@/components/NavLinks";

export async function Navbar() {
  const session = await auth();
  if (!session?.user) return null;

  const { name, role } = session.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 font-bold tracking-tight">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand)]">
            <BarChart3 className="h-3.5 w-3.5 text-black" />
          </div>
          <span className="hidden sm:inline text-sm">Sales Tracker</span>
        </Link>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Nav links with active underline */}
        <NavLinks />

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 border rounded-full pl-1 pr-3 py-1">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-black text-[10px] font-black">
              {name?.charAt(0)}
            </div>
            <span className="text-xs font-medium leading-none">{name}</span>
            <span className="text-[10px] text-muted-foreground leading-none">
              {role === "ADMIN" ? "管理員" : "銷售員"}
            </span>
          </div>

          <ThemeToggle />

          <form action={logout}>
            <button
              type="submit"
              title="登出"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </form>
        </div>

      </div>
    </header>
  );
}
