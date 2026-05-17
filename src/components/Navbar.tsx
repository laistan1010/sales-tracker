import Link from "next/link";
import { BarChart3, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/auth";
import { logout } from "@/app/login/actions";

const navLinks = [
  { href: "/leads", label: "商戶" },
  { href: "/activities", label: "記錄" },
  { href: "/users", label: "團隊" },
];

export async function Navbar() {
  const session = await auth();
  if (!session?.user) return null;

  const { name, role } = session.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-3 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold shrink-0">
          <BarChart3 className="h-5 w-5" />
          <span className="hidden sm:inline">Sales Tracker</span>
        </Link>

        <Separator orientation="vertical" className="h-5" />

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* User info + logout pushed to the right */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">
              {name?.charAt(0)}
            </div>
            <div className="text-sm leading-tight">
              <span className="font-medium">{name}</span>
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {role === "ADMIN" ? "管理員" : "銷售員"}
              </span>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              title="登出"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
