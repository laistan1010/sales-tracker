import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import type { LeadStatus } from "@/generated/prisma/enums";

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user.id;
  const isAdmin = session!.user.role === "ADMIN";

  const baseWhere = isAdmin ? {} : { assignedToId: userId };

  // Fetch counts by status in a single query
  const leads = await prisma.lead.findMany({
    where: baseWhere,
    select: { status: true },
  });

  const total = leads.length;
  const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  const statCards = [
    { label: "全部商戶",   value: total,                                                                                         status: null },
    { label: "成交",       value: byStatus["CLOSED_WON"] ?? 0,                                                                   status: "CLOSED_WON"  as LeadStatus },
    { label: "提案 / 處理", value: (byStatus["DEMO"] ?? 0) + (byStatus["OBJECTION"] ?? 0),                                       status: "DEMO"         as LeadStatus },
    { label: "潛在客戶",   value: (byStatus["LEAD"] ?? 0) + (byStatus["CONTACTED"] ?? 0),                                        status: "LEAD"         as LeadStatus },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? "全團隊數據總覽"
            : `你的個人數據 · ${session!.user.name}`}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, status }) => (
          <div
            key={label}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              {status && (
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${STATUS_LABELS[status].color}`}
                >
                  {STATUS_LABELS[status].zh}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <p className="text-xs text-muted-foreground">
          * 只顯示分配給你的商戶數據。Admin 可查看全團隊數據。
        </p>
      )}
    </div>
  );
}
