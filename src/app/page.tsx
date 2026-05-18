import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import type { LeadStatus } from "@/generated/prisma/enums";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";

function getHKDateStrings() {
  const nowHK    = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const todayStr = nowHK.toISOString().slice(0, 10);
  const in7Days  = new Date(nowHK.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
  const hour     = nowHK.getUTCHours();
  const greeting = hour < 12 ? "早晨" : hour < 18 ? "午安" : "晚上好";
  return { todayStr, in7Days, greeting };
}

function formatApptDate(d: string, todayStr: string) {
  if (d === todayStr) return "今日";
  const [, m, day] = d.split("-");
  return `${parseInt(m)}月${parseInt(day)}日`;
}

function formatApptTime(t: string | null) {
  if (!t) return null;
  const [h, min] = t.split(":").map(Number);
  const period = h >= 12 ? "下午" : "上午";
  const hour   = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${period} ${hour}:${String(min).padStart(2, "0")}`;
}

export default async function HomePage() {
  const session = await auth();
  const userId  = session!.user.id;
  const isAdmin = session!.user.role === "ADMIN";
  const name    = session!.user.name ?? "Sales";

  const baseWhere = isAdmin ? {} : { assignedToId: userId };
  const { todayStr, in7Days, greeting } = getHKDateStrings();

  // ── Stats ──────────────────────────────────────────────────────────────
  const leads = await prisma.lead.findMany({
    where: baseWhere,
    select: { status: true },
  });

  const total    = leads.length;
  const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  const statCards = [
    { label: "全部商戶",    value: total,                                                               status: null },
    { label: "成交",        value: byStatus["CLOSED_WON"] ?? 0,                                        status: "CLOSED_WON"  as LeadStatus },
    { label: "提案 / 處理", value: (byStatus["DEMO"] ?? 0) + (byStatus["OBJECTION"] ?? 0),             status: "DEMO"         as LeadStatus },
    { label: "潛在客戶",    value: (byStatus["LEAD"] ?? 0) + (byStatus["CONTACTED"] ?? 0),             status: "LEAD"         as LeadStatus },
  ];

  // ── Upcoming appointments (today + 7 days) ─────────────────────────────
  const upcomingLeads = await prisma.lead.findMany({
    where: {
      ...baseWhere,
      appointmentDate: { gte: todayStr, lte: in7Days },
    },
    select: {
      id:              true,
      storeName:       true,
      district:        true,
      appointmentDate: true,
      appointmentTime: true,
      appointmentNotes: true,
    },
    orderBy: [
      { appointmentDate: "asc" },
      { appointmentTime: "asc" },
    ],
  });

  const todayAppts  = upcomingLeads.filter(l => l.appointmentDate === todayStr);
  const futureAppts = upcomingLeads.filter(l => l.appointmentDate !== todayStr);

  return (
    <div className="space-y-6">

      {/* ── Today banner ──────────────────────────────────────────────── */}
      {todayAppts.length > 0 ? (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 p-4 shadow-sm text-white flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">👋 {greeting}！{name}</h3>
            <p className="text-sm opacity-90 mt-0.5">
              你今日有{" "}
              <strong className="text-white">{todayAppts.length}</strong>{" "}
              個會面行程，請記得帶齊資料！
            </p>
            <div className="mt-2 space-y-1">
              {todayAppts.map(l => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  className="flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
                >
                  <span>→</span>
                  <span>{l.storeName}</span>
                  <span className="font-normal opacity-75">{l.district}</span>
                  {l.appointmentTime && (
                    <span className="font-normal opacity-75">
                      · {formatApptTime(l.appointmentTime)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          <div className="shrink-0 rounded-full bg-white/20 p-3 text-2xl">📅</div>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}，{name} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? "全團隊數據總覽" : "你的個人數據"}
          </p>
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, status }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
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

      {/* ── Upcoming 7-day schedule ───────────────────────────────────── */}
      {futureAppts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            未來 7 日行程
          </h2>
          <ol className="space-y-2">
            {futureAppts.map(l => (
              <li key={l.id}>
                <Link
                  href={`/leads/${l.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-accent transition-colors"
                >
                  <div className="shrink-0 text-center w-10">
                    <p className="text-xs text-muted-foreground leading-none">
                      {l.appointmentDate!.slice(5, 7)}月
                    </p>
                    <p className="text-xl font-black leading-tight">
                      {parseInt(l.appointmentDate!.slice(8, 10))}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{l.storeName}</p>
                    <p className="text-xs text-muted-foreground">{l.district}</p>
                  </div>
                  {l.appointmentTime && (
                    <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatApptTime(l.appointmentTime)}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!isAdmin && (
        <p className="text-xs text-muted-foreground">
          * 只顯示分配給你的商戶數據。Admin 可查看全團隊數據。
        </p>
      )}
    </div>
  );
}
