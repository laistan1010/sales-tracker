import Link from "next/link";
import { BarChart3, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLinks } from "@/components/NavLinks";
import { NavSearch } from "@/components/NavSearch";
import { Suspense } from "react";

export async function Navbar() {
  const session = await auth();
  if (!session?.user) return null;

  const { name, role } = session.user;

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--navbar)] shadow-md">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-2 px-3 sm:gap-4 sm:px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand)]">
            <BarChart3 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="hidden sm:inline text-sm font-bold tracking-tight text-white">
            Sales Tracker
          </span>
        </Link>

        <div className="h-4 w-px bg-white/15 shrink-0" />

        {/* Nav links */}
        <NavLinks variant="dark" />

        {/* Search — grows to fill remaining space */}
        <Suspense>
          <NavSearch />
        </Suspense>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* User pill */}
          <div className="hidden sm:flex items-center gap-2 border border-white/20 rounded-full pl-1 pr-3 py-1">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white text-[10px] font-black">
              {name?.charAt(0)}
            </div>
            <span className="text-xs font-medium leading-none text-white">{name}</span>
            <span className="text-[10px] leading-none text-white/55">
              {role === "ADMIN" ? "管理員" : "銷售員"}
            </span>
          </div>

          <ThemeToggle />

          <form action={logout}>
            <button
              type="submit"
              title="登出"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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
