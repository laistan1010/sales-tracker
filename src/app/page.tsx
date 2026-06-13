import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, TASK_TYPE_META, INDUSTRY_LABELS, ACTIVITY_LABELS } from "@/lib/constants";
import type { LeadStatus, ActivityType, Industry } from "@/generated/prisma/enums";
import Link from "next/link";
import { CalendarDays, Clock, TrendingUp, BarChart2, Trophy, Users } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────

function getHKTimes() {
  const nowHK        = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const todayStr     = nowHK.toISOString().slice(0, 10);
  const in7Days      = new Date(nowHK.getTime() + 7  * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const thisWeekStart = new Date(nowHK.getTime() - 7  * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(nowHK.getTime() - 14 * 24 * 60 * 60 * 1000);
  const hour         = nowHK.getUTCHours();
  const greeting     = hour < 12 ? "早晨" : hour < 18 ? "午安" : "晚上好";
  return { todayStr, in7Days, greeting, thisWeekStart, lastWeekStart };
}

function formatApptTime(t: string | null) {
  if (!t) return null;
  const [h, min] = t.split(":").map(Number);
  const period   = h >= 12 ? "下午" : "上午";
  const hour     = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${period} ${hour}:${String(min).padStart(2, "0")}`;
}

function countByType<T extends string>(items: { type: T }[]): Partial<Record<T, number>> {
  return items.reduce<Partial<Record<T, number>>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});
}

// ── Pipeline Funnel ────────────────────────────────────────────────────────

const FUNNEL_STAGES: { status: LeadStatus; bar: string }[] = [
  { status: "LEAD",      bar: "bg-gray-400"   },
  { status: "CONTACTED", bar: "bg-blue-400"   },
  { status: "DEMO",      bar: "bg-purple-400" },
  { status: "OBJECTION", bar: "bg-yellow-400" },
];

function PipelineFunnel({
  byStatus,
  total,
}: {
  byStatus: Partial<Record<LeadStatus, number>>;
  total:    number;
}) {
  const won  = byStatus.CLOSED_WON  ?? 0;
  const lost = byStatus.CLOSED_LOST ?? 0;
  const winRate = (won + lost) > 0 ? Math.round(won / (won + lost) * 100) : null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        銷售漏斗
      </h2>

      <div className="space-y-2.5">
        {FUNNEL_STAGES.map(({ status, bar }) => {
          const count = byStatus[status] ?? 0;
          const pct   = total > 0 ? Math.round(count / total * 100) : 0;
          const { zh, icon } = STATUS_LABELS[status];
          return (
            <div key={status} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{icon} {zh}</span>
                <span className="font-semibold">
                  {count}
                  <span className="text-muted-foreground font-normal ml-1 text-[10px]">{pct}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 pt-1 border-t">
        <div className="flex-1 rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-center">
          <p className="text-xl font-black text-green-600">{won}</p>
          <p className="text-xs text-muted-foreground">🏆 成交</p>
        </div>
        <div className="flex-1 rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-center">
          <p className="text-xl font-black text-red-500">{lost}</p>
          <p className="text-xs text-muted-foreground">❌ 失敗</p>
        </div>
        {winRate !== null && (
          <div className="flex-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
            <p className="text-xl font-black text-blue-600">{winRate}%</p>
            <p className="text-xs text-muted-foreground">成交率</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Activity Comparison ────────────────────────────────────────────────────

const TRACKED_ACTIVITY_TYPES: ActivityType[] = ["PHONE", "WHATSAPP", "WALK_IN", "MEETING", "EMAIL"];

function ActivityComparison({
  thisWeek,
  lastWeek,
}: {
  thisWeek: Partial<Record<ActivityType, number>>;
  lastWeek: Partial<Record<ActivityType, number>>;
}) {
  const thisTotal = TRACKED_ACTIVITY_TYPES.reduce((s, t) => s + (thisWeek[t] ?? 0), 0);
  const lastTotal = TRACKED_ACTIVITY_TYPES.reduce((s, t) => s + (lastWeek[t] ?? 0), 0);
  const totalDiff = thisTotal - lastTotal;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          活動追蹤
        </h2>
        <span className={`text-xs font-semibold ${
          totalDiff > 0 ? "text-green-600" : totalDiff < 0 ? "text-red-500" : "text-muted-foreground"
        }`}>
          共 {thisTotal} 次
          {totalDiff !== 0 && (
            <span className="ml-1">{totalDiff > 0 ? `▲ +${totalDiff}` : `▼ ${totalDiff}`}</span>
          )}
        </span>
      </div>

      <div className="space-y-3">
        {TRACKED_ACTIVITY_TYPES.map(type => {
          const curr = thisWeek[type] ?? 0;
          const prev = lastWeek[type] ?? 0;
          const diff = curr - prev;
          const { zh, icon } = ACTIVITY_LABELS[type];
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="w-5 text-center text-sm">{icon}</span>
              <span className="flex-1 text-xs text-muted-foreground">{zh}</span>
              <span className="text-sm font-bold tabular-nums w-5 text-right">{curr}</span>
              <span className={`text-[10px] font-medium w-14 text-right tabular-nums ${
                diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-muted-foreground"
              }`}>
                {diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">數字 = 最近 7 日　▲▼ = 對比再前 7 日</p>
    </div>
  );
}

// ── Industry & District Breakdown ──────────────────────────────────────────

function IndustryBreakdown({ data }: { data: { industry: Industry; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-muted-foreground" />
        行業分佈
      </h2>
      <div className="space-y-2.5">
        {data.map(({ industry, count }) => {
          const { zh, bar } = INDUSTRY_LABELS[industry];
          const pct = Math.round(count / max * 100);
          return (
            <div key={industry} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{zh}</span>
                <span className="font-semibold">{count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DistrictBreakdown({ data, total }: { data: [string, number][]; total: number }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-muted-foreground" />
        地區分佈（前 6 名）
      </h2>
      <div className="space-y-2.5">
        {data.map(([district, count]) => {
          const pct = total > 0 ? Math.round(count / total * 100) : 0;
          return (
            <div key={district} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{district}</span>
                <span className="font-semibold">
                  {count}
                  <span className="text-muted-foreground font-normal ml-1 text-[10px]">{pct}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Leaderboard (Admin only) ───────────────────────────────────────────────

type LeaderboardEntry = {
  user:                { id: string; name: string };
  total:               number;
  active:              number;
  won:                 number;
  activitiesThisWeek:  number;
  todayCount:          number;
  upcomingCount:       number;
};

function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const sorted = [...entries].sort((a, b) => b.won - a.won || b.active - a.active);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">銷售員表現</h2>
      </div>
      <div className="divide-y">
        {sorted.map(({ user, total, active, won, activitiesThisWeek, todayCount }, i) => (
          <div key={user.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-sm font-black text-muted-foreground w-5 text-center">
              {medals[i] ?? i + 1}
            </span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <p className="flex-1 font-semibold text-sm">{user.name}</p>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="text-base font-black">{total}</p>
                <p className="text-muted-foreground">商戶</p>
              </div>
              <div className="text-center">
                <p className="text-base font-black text-purple-600">{active}</p>
                <p className="text-muted-foreground">進行中</p>
              </div>
              <div className="text-center">
                <p className="text-base font-black text-green-600">{won}</p>
                <p className="text-muted-foreground">成交</p>
              </div>
              <div className="text-center hidden sm:block">
                <p className={`text-base font-black ${todayCount > 0 ? "text-amber-500" : ""}`}>
                  {todayCount}
                </p>
                <p className="text-muted-foreground">今日</p>
              </div>
              <div className="text-center hidden sm:block">
                <p className="text-base font-black text-blue-600">{activitiesThisWeek}</p>
                <p className="text-muted-foreground">7日活動</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const session = await auth();
  const userId  = session!.user.id;
  const isAdmin = session!.user.role === "ADMIN";
  const name    = session!.user.name ?? "Sales";

  const { todayStr, in7Days, greeting, thisWeekStart, lastWeekStart } = getHKTimes();

  const statsWhere = isAdmin ? {} : { assignedToId: userId };

  // Parallel fetch: leads + recent activities (last 14 days for comparison)
  const [leads, recentActivities] = await Promise.all([
    prisma.lead.findMany({
      where: statsWhere,
      select: { status: true, industry: true, district: true, assignedToId: true },
    }),
    prisma.activity.findMany({
      where: isAdmin
        ? { createdAt: { gte: lastWeekStart } }
        : { lead: { assignedToId: userId }, createdAt: { gte: lastWeekStart } },
      select: { type: true, createdAt: true, lead: { select: { assignedToId: true } } },
    }),
  ]);

  // Pipeline stats
  const total    = leads.length;
  const byStatus = leads.reduce<Partial<Record<LeadStatus, number>>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  // Stat cards
  const statCards = [
    { label: "全部商戶",    value: total,                                                   status: null,                       href: "/leads" },
    { label: "成交",        value: byStatus.CLOSED_WON ?? 0,                               status: "CLOSED_WON"  as LeadStatus, href: "/leads?by=status&filter=CLOSED_WON" },
    { label: "提案 / 處理", value: (byStatus.DEMO ?? 0) + (byStatus.OBJECTION ?? 0),       status: "DEMO"        as LeadStatus, href: "/leads?by=status&filter=DEMO,OBJECTION" },
    { label: "潛在客戶",    value: (byStatus.LEAD ?? 0) + (byStatus.CONTACTED ?? 0),       status: "LEAD"        as LeadStatus, href: "/leads?by=status&filter=LEAD,CONTACTED" },
  ];

  // Activity comparison (split by week boundary)
  const thisWeekActs = recentActivities.filter(a => new Date(a.createdAt) >= thisWeekStart);
  const lastWeekActs = recentActivities.filter(a => new Date(a.createdAt) <  thisWeekStart);
  const thisWeekByType = countByType<ActivityType>(thisWeekActs);
  const lastWeekByType = countByType<ActivityType>(lastWeekActs);

  // Industry breakdown (sorted by count desc)
  const industryMap  = leads.reduce<Partial<Record<Industry, number>>>((acc, l) => {
    acc[l.industry] = (acc[l.industry] ?? 0) + 1;
    return acc;
  }, {});
  const industryData = (Object.entries(industryMap) as [Industry, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([industry, count]) => ({ industry, count }));

  // District breakdown (top 6, skip placeholder)
  const districtMap  = leads.reduce<Record<string, number>>((acc, l) => {
    if (l.district && l.district !== "待補填") acc[l.district] = (acc[l.district] ?? 0) + 1;
    return acc;
  }, {});
  const districtData = Object.entries(districtMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // ── Admin view ─────────────────────────────────────────────────────────

  if (isAdmin) {
    const [salesUsers, teamTasks] = await Promise.all([
      prisma.user.findMany({ where: { role: "SALES" }, orderBy: { name: "asc" } }),
      prisma.task.findMany({
        where: { date: { gte: todayStr, lte: in7Days } },
        select: { date: true, lead: { select: { assignedToId: true } } },
      }),
    ]);

    const leaderboardEntries: LeaderboardEntry[] = salesUsers.map(user => {
      const userLeads = leads.filter(l => l.assignedToId === user.id);
      const won       = userLeads.filter(l => l.status === "CLOSED_WON").length;
      const lost      = userLeads.filter(l => l.status === "CLOSED_LOST").length;
      const active    = userLeads.length - won - lost;
      const activitiesThisWeek = thisWeekActs.filter(a => a.lead.assignedToId === user.id).length;
      const todayCount     = teamTasks.filter(t => t.lead.assignedToId === user.id && t.date === todayStr).length;
      const upcomingCount  = teamTasks.filter(t => t.lead.assignedToId === user.id && t.date >  todayStr).length;
      return { user, total: userLeads.length, active, won, activitiesThisWeek, todayCount, upcomingCount };
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}，{name} 👋</h1>
          <p className="text-sm text-muted-foreground">全團隊數據總覽</p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, status, href }) => (
            <Link key={label} href={href}
              className="rounded-xl border bg-card p-5 shadow-sm hover:bg-accent transition-colors active:bg-accent/80">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {status && (
                  <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_LABELS[status].color}`}>
                    {STATUS_LABELS[status].zh}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </Link>
          ))}
        </div>

        {/* Funnel + Activity */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <PipelineFunnel byStatus={byStatus} total={total} />
          <ActivityComparison thisWeek={thisWeekByType} lastWeek={lastWeekByType} />
        </div>

        {/* Distribution */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {industryData.length > 0 && <IndustryBreakdown data={industryData} />}
          {districtData.length > 0 && <DistrictBreakdown data={districtData} total={total} />}
        </div>

        {/* Leaderboard */}
        <Leaderboard entries={leaderboardEntries} />
      </div>
    );
  }

  // ── Sales view ─────────────────────────────────────────────────────────

  const upcomingTasks = await prisma.task.findMany({
    where: {
      date: { gte: todayStr, lte: in7Days },
      lead: { assignedToId: userId },
    },
    include: {
      lead: { select: { id: true, storeName: true, district: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const todayTasks  = upcomingTasks.filter(t => t.date === todayStr);
  const futureTasks = upcomingTasks.filter(t => t.date !== todayStr);

  return (
    <div className="space-y-6">

      {/* Today banner */}
      {todayTasks.length > 0 ? (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 p-4 shadow-sm text-white flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">👋 {greeting}！{name}</h3>
            <p className="text-sm opacity-90 mt-0.5">
              你今日有 <strong className="text-white">{todayTasks.length}</strong> 個工作項目待完成！
            </p>
            <div className="mt-2 space-y-1">
              {todayTasks.map(t => (
                <Link key={t.id} href={`/leads/${t.lead.id}`}
                  className="flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
                  <span>{TASK_TYPE_META[t.type].icon}</span>
                  <span>{t.lead.storeName}</span>
                  <span className="font-normal opacity-75">{t.lead.district}</span>
                  {t.time && <span className="font-normal opacity-75">· {formatApptTime(t.time)}</span>}
                </Link>
              ))}
            </div>
          </div>
          <div className="shrink-0 rounded-full bg-white/20 p-3 text-2xl">📋</div>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}，{name} 👋</h1>
          <p className="text-muted-foreground text-sm">你的個人數據</p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, status, href }) => (
          <Link key={label} href={href}
            className="rounded-xl border bg-card p-5 shadow-sm hover:bg-accent transition-colors active:bg-accent/80">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              {status && (
                <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_LABELS[status].color}`}>
                  {STATUS_LABELS[status].zh}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </Link>
        ))}
      </div>

      {/* Funnel + Activity */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <PipelineFunnel byStatus={byStatus} total={total} />
        <ActivityComparison thisWeek={thisWeekByType} lastWeek={lastWeekByType} />
      </div>

      {/* Distribution */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {industryData.length > 0 && <IndustryBreakdown data={industryData} />}
        {districtData.length > 0 && <DistrictBreakdown data={districtData} total={total} />}
      </div>

      {/* Upcoming 7-day tasks */}
      {futureTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            未來 7 日工作項目
          </h2>
          <ol className="space-y-2">
            {futureTasks.map(t => (
              <li key={t.id}>
                <Link href={`/leads/${t.lead.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-accent transition-colors">
                  <div className="shrink-0 text-center w-10">
                    <p className="text-xs text-muted-foreground leading-none">{t.date.slice(5, 7)}月</p>
                    <p className="text-xl font-black leading-tight">{parseInt(t.date.slice(8, 10))}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{t.lead.storeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {TASK_TYPE_META[t.type].icon} {TASK_TYPE_META[t.type].zh} · {t.lead.district}
                    </p>
                  </div>
                  {t.time && (
                    <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatApptTime(t.time)}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="text-xs text-muted-foreground">* 只顯示分配給你的商戶數據。</p>
    </div>
  );
}
