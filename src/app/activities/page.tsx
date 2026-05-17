import Link from "next/link";
import { prisma } from "@/lib/db";
import { ACTIVITY_LABELS, STATUS_LABELS, INDUSTRY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default async function ActivitiesPage() {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      lead: {
        include: { assignedTo: true },
      },
    },
  });

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h1 className="text-xl font-bold tracking-tight">跟進記錄</h1>
        <p className="text-sm text-muted-foreground">全團隊最新動態</p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          暫時未有記錄
        </div>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-border pl-5">
          {activities.map((act) => {
            const meta = ACTIVITY_LABELS[act.type];
            const statusMeta = STATUS_LABELS[act.lead.status];
            const industryMeta = INDUSTRY_LABELS[act.lead.industry];

            const date = new Date(act.createdAt);
            const dateLabel = date.toLocaleDateString("zh-HK", {
              month: "short",
              day: "numeric",
            });
            const timeLabel = date.toLocaleTimeString("zh-HK", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <li key={act.id} className="relative">
                {/* Timeline dot */}
                <span className="absolute -left-[1.625rem] flex h-6 w-6 items-center justify-center rounded-full border bg-background text-sm">
                  {meta.icon}
                </span>

                <div className="rounded-xl border bg-card p-4 space-y-2 shadow-sm">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <Link
                        href={`/leads/${act.lead.id}`}
                        className="font-semibold hover:underline leading-tight"
                      >
                        {act.lead.storeName}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                            industryMeta.color
                          )}
                        >
                          {industryMeta.zh}
                        </span>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                            statusMeta.color
                          )}
                        >
                          {statusMeta.zh}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium">{dateLabel}</p>
                      <p className="text-xs text-muted-foreground">{timeLabel}</p>
                    </div>
                  </div>

                  {/* Activity type */}
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
                      meta.color
                    )}
                  >
                    {meta.icon} {meta.zh}
                  </div>

                  {/* Notes */}
                  <p className="text-sm leading-relaxed text-muted-foreground">{act.notes}</p>

                  {/* Staff */}
                  {act.lead.assignedTo && (
                    <p className="text-xs text-muted-foreground">
                      by {act.lead.assignedTo.name}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
