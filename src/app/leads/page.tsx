import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Industry, LeadStatus } from "@/generated/prisma/enums";
import { ALL_INDUSTRIES, ALL_STATUSES } from "@/lib/constants";
import { LeadsClient } from "./LeadsClient";
import { CreateLeadModal } from "./CreateLeadModal";

interface PageProps {
  searchParams: Promise<{ by?: string; filter?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const [session, { by, filter }] = await Promise.all([auth(), searchParams]);

  const userId = session!.user.id;
  const isAdmin = session!.user.role === "ADMIN";

  const filterType = by === "status" ? "status" : "industry";
  const filterValue = filter || "all";

  const validFilter =
    filterValue === "all" ||
    (filterType === "industry"
      ? (ALL_INDUSTRIES as string[]).includes(filterValue)
      : (ALL_STATUSES as string[]).includes(filterValue));

  const rbacWhere = isAdmin ? {} : { assignedToId: userId };
  const enumFilter =
    validFilter && filterValue !== "all"
      ? filterType === "industry"
        ? { industry: filterValue as Industry }
        : { status: filterValue as LeadStatus }
      : {};

  const leads = await prisma.lead.findMany({
    where: { ...rbacWhere, ...enumFilter },
    include: { assignedTo: true },
    orderBy: { storeName: "asc" },
  });

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">商戶列表</h1>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground mt-0.5">僅顯示你的商戶</p>
          )}
        </div>
        {/* CreateLeadModal is a Client Component — renders the button + dialog */}
        <CreateLeadModal />
      </div>

      <Suspense>
        <LeadsClient
          leads={leads}
          filterType={filterType}
          filterValue={validFilter ? filterValue : "all"}
        />
      </Suspense>
    </div>
  );
}
