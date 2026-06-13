"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/leads",      label: "商戶" },
  { href: "/activities", label: "記錄" },
  { href: "/users",      label: "團隊" },
];

export function NavLinks({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const dark = variant === "dark";
  return (
    <nav className="flex items-center gap-0.5">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              active
                ? dark ? "text-white" : "text-foreground"
                : dark
                  ? "text-white/55 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {label}
            {active && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--brand)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
