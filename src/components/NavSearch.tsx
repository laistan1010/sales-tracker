"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export function NavSearch() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  // Sync input with URL when on leads page; clear when elsewhere
  useEffect(() => {
    setQuery(pathname === "/leads" ? (searchParams.get("search") ?? "") : "");
  }, [pathname, searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/leads?search=${encodeURIComponent(q)}`);
    else    router.push("/leads");
  }

  function handleClear() {
    setQuery("");
    router.push("/leads");
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 min-w-0">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/45" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜尋商戶…"
          className="h-8 w-full rounded-md border border-white/15 bg-white/10 pl-8 pr-7 text-sm text-white placeholder:text-white/40 transition-colors focus:border-white/30 focus:bg-white/15 focus:outline-none"
          style={{ WebkitTextFillColor: "white", caretColor: "white" }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </form>
  );
}
