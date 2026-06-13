import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, INDUSTRY_LABELS, ACTIVITY_LABELS } from "@/lib/constants";
import type { LeadStatus, ActivityType, Industry, TaskType } from "@/generated/prisma/enums";
import Link from "next/link";
import {
  CalendarDays, Clock, TrendingUp, BarChart2, Trophy, X,
  Phone, MessageSquare, MapPin, Users, Mail, RefreshCw,
  CheckCircle2, XCircle, Award,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────

function getHKTimes() {
  const nowHK         = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const todayStr      = nowHK.toISOString().slice(0, 10);
  const in7Days       = new Date(nowHK.getTime() + 7  * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const thisWeekStart = new Date(nowHK.getTime() - 7  * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(nowHK.getTime() - 14 * 24 * 60 * 60 * 1000);
  const hour          = nowHK.getUTCHours();
  const greeting      = hour < 12 ? "早晨" : hour < 18 ? "午安" : "晚上好";
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

// ── Icon maps (lucide, no emoji) ───────────────────────────────────────────

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  PHONE:    Phone,
  WHATSAPP: MessageSquare,
  WALK_IN:  MapPin,
  PIPELINE: RefreshCw,
  MEETING:  Users,
  EMAIL:    Mail,
};

const TASK_ICONS: Record<TaskType, React.ElementType> = {
  MEETING: Users,
  CALL:    Phone,
  EMAIL:   Mail,
};

// ── Shared data helpers ────────────────────────────────────────────────────

type LeadSlice = { status: LeadStatus; industry: Industry; district: string; assignedToId: string | null };

function computeDashStats(leads: LeadSlice[]) {
  const total    = leads.length;
  const byStatus = leads.reduce<Partial<Record<LeadStatus, number>>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});
  const industryMap  = leads.reduce<Partial<Record<Industry, number>>>((acc, l) => {
    acc[l.industry] = (acc[l.industry] ?? 0) + 1;
    return acc;
  }, {});
  const districtMap  = leads.reduce<Record<string, number>>((acc, l) => {
    if (l.district && l.district !== "待補填") acc[l.district] = (acc[l.district] ?? 0) + 1;
    return acc;
  }, {});
  const industryData = (Object.entries(industryMap) as [Industry, number][])
    .sort((a, b) => b[1] - a[1]).map(([industry, count]) => ({ industry, count }));
  const districtData = Object.entries(districtMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return { total, byStatus, industryData, districtData };
}

// ── Pipeline Funnel ────────────────────────────────────────────────────────

const FUNNEL_STAGES: { status: LeadStatus; bar: string; dot: string }[] = [
  { status: "LEAD",      bar: "bg-orange-200", dot: "bg-orange-200" },
  { status: "CONTACTED", bar: "bg-orange-400", dot: "bg-orange-400" },
  { status: "DEMO",      bar: "bg-orange-500", dot: "bg-orange-500" },
  { status: "OBJECTION", bar: "bg-orange-600", dot: "bg-orange-600" },
];

function PipelineFunnel({ byStatus, total }: {
  byStatus: Partial<Record<LeadStatus, number>>;
  total:    number;
}) {
  const won     = byStatus.CLOSED_WON  ?? 0;
  const lost    = byStatus.CLOSED_LOST ?? 0;
  const winRate = (won + lost) > 0 ? Math.round(won / (won + lost) * 100) : null;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5" />
        銷售漏斗
      </h2>
      <div className="space-y-3">
        {FUNNEL_STAGES.map(({ status, bar, dot }) => {
          const count = byStatus[status] ?? 0;
          const pct   = total > 0 ? Math.round(count / total * 100) : 0;
          const { zh } = STATUS_LABELS[status];
          return (
            <div key={status} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  {zh}
                </span>
                <span className="font-semibold tabular-nums font-mono">
                  {count}
                  <span className="text-muted-foreground font-sans font-normal ml-1.5">{pct}%</span>
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <div className="flex-1 rounded-md bg-orange-600/10 border border-orange-600/20 p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-orange-600 shrink-0" />
          <div>
            <p className="text-lg font-black font-mono text-orange-600 leading-none">{won}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">成交</p>
          </div>
        </div>
        <div className="flex-1 rounded-md bg-zinc-500/10 border border-zinc-500/20 p-3 flex items-center gap-2">
          <XCircle className="h-4 w-4 text-zinc-500 shrink-0" />
          <div>
            <p className="text-lg font-black font-mono text-zinc-500 leading-none">{lost}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">失敗</p>
          </div>
        </div>
        {winRate !== null && (
          <div className="flex-1 rounded-md bg-[var(--brand)]/10 border border-[var(--brand)]/20 p-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-[var(--brand)] shrink-0" />
            <div>
              <p className="text-lg font-black font-mono text-[var(--brand)] leading-none">{winRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">成交率</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Activity Comparison ────────────────────────────────────────────────────

const TRACKED_ACTIVITY_TYPES: ActivityType[] = ["PHONE", "WHATSAPP", "WALK_IN", "MEETING", "EMAIL"];

function ActivityComparison({ thisWeek, lastWeek }: {
  thisWeek: Partial<Record<ActivityType, number>>;
  lastWeek: Partial<Record<ActivityType, number>>;
}) {
  const thisTotal = TRACKED_ACTIVITY_TYPES.reduce((s, t) => s + (thisWeek[t] ?? 0), 0);
  const lastTotal = TRACKED_ACTIVITY_TYPES.reduce((s, t) => s + (lastWeek[t] ?? 0), 0);
  const totalDiff = thisTotal - lastTotal;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5" />
          活動追蹤
        </h2>
        <span className={`text-xs font-mono font-semibold ${
          totalDiff > 0 ? "text-orange-600" : totalDiff < 0 ? "text-zinc-500" : "text-muted-foreground"
        }`}>
          {thisTotal} 次
          {totalDiff !== 0 && (
            <span className="ml-1">{totalDiff > 0 ? `+${totalDiff}` : totalDiff}</span>
          )}
        </span>
      </div>

      <div className="space-y-2.5">
        {TRACKED_ACTIVITY_TYPES.map(type => {
          const curr = thisWeek[type] ?? 0;
          const prev = lastWeek[type] ?? 0;
          const diff = curr - prev;
          const { zh } = ACTIVITY_LABELS[type];
          const Icon  = ACTIVITY_ICONS[type];
          return (
            <div key={type} className="flex items-center gap-3">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 text-xs text-muted-foreground">{zh}</span>
              <span className="text-sm font-bold font-mono tabular-nums w-5 text-right">{curr}</span>
              <span className={`text-[10px] font-mono font-medium w-12 text-right tabular-nums ${
                diff > 0 ? "text-orange-600" : diff < 0 ? "text-zinc-500" : "text-muted-foreground"
              }`}>
                {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground border-t pt-2">
        數字 = 最近 7 日　±差 = 對比再前 7 日
      </p>
    </div>
  );
}

// ── Distribution Charts ────────────────────────────────────────────────────

function IndustryBreakdown({ data }: { data: { industry: Industry; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <BarChart2 className="h-3.5 w-3.5" />
        行業分佈
      </h2>
      <div className="space-y-3">
        {data.map(({ industry, count }) => {
          const { zh, bar } = INDUSTRY_LABELS[industry];
          return (
            <div key={industry} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{zh}</span>
                <span className="font-semibold font-mono tabular-nums">{count}</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${bar}`}
                  style={{ width: `${Math.round(count / max * 100)}%` }} />
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
    <div className="rounded-lg border bg-card p-5 shadow-sm space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <BarChart2 className="h-3.5 w-3.5" />
        地區分佈（前 6 名）
      </h2>
      <div className="space-y-3">
        {data.map(([district, count]) => {
          const pct = total > 0 ? Math.round(count / total * 100) : 0;
          return (
            <div key={district} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{district}</span>
                <span className="font-semibold font-mono tabular-nums">
                  {count}
                  <span className="text-muted-foreground font-sans font-normal ml-1.5 text-[10px]">{pct}%</span>
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-orange-400" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Leaderboard ────────────────────────────────────────────────────────────

type LeaderboardEntry = {
  user:               { id: string; name: string };
  total:              number;
  active:             number;
  won:                number;
  activitiesThisWeek: number;
  todayCount:         number;
};

function Leaderboard({ entries, selectedRepId }: {
  entries:       LeaderboardEntry[];
  selectedRepId: string | null;
}) {
  const sorted = [...entries].sort((a, b) => b.won - a.won || b.active - a.active);

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b flex items-center gap-2">
        <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">銷售員表現</h2>
        {selectedRepId && (
          <span className="text-[10px] text-muted-foreground ml-1">— 撳行切換查看</span>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
        <span className="w-5 shrink-0" />
        <span className="w-9 shrink-0" />
        <span className="flex-1" />
        <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="w-10 text-center">商戶</span>
          <span className="w-10 text-center text-orange-400">進行中</span>
          <span className="w-10 text-center text-orange-700">成交</span>
          <span className="w-10 text-center hidden sm:block text-orange-500">今日</span>
          <span className="w-10 text-center hidden sm:block text-orange-300">活動</span>
        </div>
      </div>

      <div className="divide-y">
        {sorted.map(({ user, total, active, won, activitiesThisWeek, todayCount }, i) => {
          const isSelected = user.id === selectedRepId;
          return (
            <Link
              key={user.id}
              href={isSelected ? "/" : `/?rep=${user.id}`}
              className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent ${
                isSelected ? "bg-accent" : ""
              }`}
            >
              {/* Rank badge */}
              <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-black shrink-0 ${
                i === 0 ? "bg-[var(--brand)] text-black"
                : i === 1 ? "bg-zinc-400/30 text-foreground"
                : i === 2 ? "bg-zinc-400/20 text-foreground"
                : "text-muted-foreground"
              }`}>
                {i + 1}
              </span>

              {/* Avatar */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-black text-sm ${
                isSelected
                  ? "bg-[var(--brand)] text-black"
                  : "bg-foreground text-background"
              }`}>
                {user.name.charAt(0)}
              </div>

              <p className="flex-1 font-semibold text-sm">{user.name}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm font-mono font-bold tabular-nums">
                <span className="w-10 text-center">{total}</span>
                <span className="w-10 text-center text-orange-400">{active}</span>
                <span className="w-10 text-center text-orange-700">{won}</span>
                <span className={`w-10 text-center hidden sm:block ${todayCount > 0 ? "text-orange-500" : ""}`}>
                  {todayCount}
                </span>
                <span className="w-10 text-center hidden sm:block text-orange-300">{activitiesThisWeek}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat Cards ─────────────────────────────────────────────────────────────

function StatCards({ cards }: {
  cards: { label: string; value: number; status: LeadStatus | null; href: string; accent?: boolean }[];
}) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, status, href, accent }) => (
        <Link key={label} href={href}
          className={`rounded-lg border bg-card p-4 shadow-sm hover:bg-accent transition-colors active:bg-accent/80 ${
            accent ? "border-l-2 border-l-[var(--brand)]" : ""
          }`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {status && (
              <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_LABELS[status].color}`}>
                {STATUS_LABELS[status].zh}
              </Badge>
            )}
          </div>
          <p className="text-3xl font-black font-mono tabular-nums">{value}</p>
        </Link>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

type Props = { searchParams: Promise<{ rep?: string }> };

export default async function HomePage({ searchParams }: Props) {
  const session = await auth();
  const params  = await searchParams;

  const userId  = session!.user.id;
  const isAdmin = session!.user.role === "ADMIN";
  const name    = session!.user.name ?? "Sales";
  const repId   = isAdmin ? (params.rep ?? null) : null;

  const { todayStr, in7Days, greeting, thisWeekStart, lastWeekStart } = getHKTimes();

  // ── Admin view ─────────────────────────────────────────────────────────

  if (isAdmin) {
    const [allLeads, allRecentActivities, salesUsers, teamTasks] = await Promise.all([
      prisma.lead.findMany({
        select: { status: true, industry: true, district: true, assignedToId: true },
      }),
      prisma.activity.findMany({
        where: { createdAt: { gte: lastWeekStart } },
        select: { type: true, createdAt: true, lead: { select: { assignedToId: true } } },
      }),
      prisma.user.findMany({ where: { role: "SALES" }, orderBy: { name: "asc" } }),
      prisma.task.findMany({
        where: { date: { gte: todayStr, lte: in7Days } },
        select: { date: true, lead: { select: { assignedToId: true } } },
      }),
    ]);

    const selectedRep = repId ? salesUsers.find(u => u.id === repId) ?? null : null;

    const dashLeads      = repId ? allLeads.filter(l => l.assignedToId === repId) : allLeads;
    const dashActivities = repId
      ? allRecentActivities.filter(a => a.lead.assignedToId === repId)
      : allRecentActivities;

    const { total, byStatus, industryData, districtData } = computeDashStats(dashLeads);

    const statCards = [
      { label: "全部商戶",    value: total,                                               status: null,                        href: "/leads",                                        accent: false },
      { label: "成交",        value: byStatus.CLOSED_WON ?? 0,                           status: "CLOSED_WON" as LeadStatus,  href: "/leads?by=status&filter=CLOSED_WON",            accent: true  },
      { label: "提案 / 處理", value: (byStatus.DEMO ?? 0) + (byStatus.OBJECTION ?? 0),   status: "DEMO"       as LeadStatus,  href: "/leads?by=status&filter=DEMO,OBJECTION",        accent: false },
      { label: "潛在客戶",    value: (byStatus.LEAD ?? 0) + (byStatus.CONTACTED ?? 0),   status: "LEAD"       as LeadStatus,  href: "/leads?by=status&filter=LEAD,CONTACTED",        accent: false },
    ];

    const thisWeekActs   = dashActivities.filter(a => new Date(a.createdAt) >= thisWeekStart);
    const lastWeekActs   = dashActivities.filter(a => new Date(a.createdAt) <  thisWeekStart);
    const thisWeekByType = countByType<ActivityType>(thisWeekActs);
    const lastWeekByType = countByType<ActivityType>(lastWeekActs);

    const leaderboardEntries: LeaderboardEntry[] = salesUsers.map(user => {
      const userLeads = allLeads.filter(l => l.assignedToId === user.id);
      const won       = userLeads.filter(l => l.status === "CLOSED_WON").length;
      const lost      = userLeads.filter(l => l.status === "CLOSED_LOST").length;
      const active    = userLeads.length - won - lost;
      const activitiesThisWeek = allRecentActivities.filter(
        a => a.lead.assignedToId === user.id && new Date(a.createdAt) >= thisWeekStart
      ).length;
      const todayCount = teamTasks.filter(
        t => t.lead.assignedToId === user.id && t.date === todayStr
      ).length;
      return { user, total: userLeads.length, active, won, activitiesThisWeek, todayCount };
    });

    return (
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              {greeting}，{name}
            </p>
            <h1 className="text-xl font-bold tracking-tight">
              {selectedRep ? `${selectedRep.name} 的個人業績` : "全團隊數據總覽"}
            </h1>
          </div>
          {selectedRep && (
            <Link href="/"
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors shrink-0">
              <X className="h-3 w-3" />
              返回全隊
            </Link>
          )}
        </div>

        {/* Rep filter banner */}
        {selectedRep && (
          <div className="flex items-center gap-3 rounded-lg border-l-2 border-l-[var(--brand)] bg-card px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand)] text-black font-black text-sm shrink-0">
              {selectedRep.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm">{selectedRep.name}</p>
              <p className="text-xs text-muted-foreground">以下所有數據只顯示此銷售員的商戶</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <StatCards cards={statCards} />

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
        <Leaderboard entries={leaderboardEntries} selectedRepId={repId} />

      </div>
    );
  }

  // ── Sales view ─────────────────────────────────────────────────────────

  const [leads, recentActivities, upcomingTasks] = await Promise.all([
    prisma.lead.findMany({
      where: { assignedToId: userId },
      select: { status: true, industry: true, district: true, assignedToId: true },
    }),
    prisma.activity.findMany({
      where: { lead: { assignedToId: userId }, createdAt: { gte: lastWeekStart } },
      select: { type: true, createdAt: true, lead: { select: { assignedToId: true } } },
    }),
    prisma.task.findMany({
      where: { date: { gte: todayStr, lte: in7Days }, lead: { assignedToId: userId } },
      include: { lead: { select: { id: true, storeName: true, district: true } } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    }),
  ]);

  const { total, byStatus, industryData, districtData } = computeDashStats(leads);

  const statCards = [
    { label: "全部商戶",    value: total,                                               status: null,                        href: "/leads",                                 accent: false },
    { label: "成交",        value: byStatus.CLOSED_WON ?? 0,                           status: "CLOSED_WON" as LeadStatus,  href: "/leads?by=status&filter=CLOSED_WON",     accent: true  },
    { label: "提案 / 處理", value: (byStatus.DEMO ?? 0) + (byStatus.OBJECTION ?? 0),   status: "DEMO"       as LeadStatus,  href: "/leads?by=status&filter=DEMO,OBJECTION", accent: false },
    { label: "潛在客戶",    value: (byStatus.LEAD ?? 0) + (byStatus.CONTACTED ?? 0),   status: "LEAD"       as LeadStatus,  href: "/leads?by=status&filter=LEAD,CONTACTED", accent: false },
  ];

  const thisWeekActs   = recentActivities.filter(a => new Date(a.createdAt) >= thisWeekStart);
  const lastWeekActs   = recentActivities.filter(a => new Date(a.createdAt) <  thisWeekStart);
  const thisWeekByType = countByType<ActivityType>(thisWeekActs);
  const lastWeekByType = countByType<ActivityType>(lastWeekActs);

  const todayTasks  = upcomingTasks.filter(t => t.date === todayStr);
  const futureTasks = upcomingTasks.filter(t => t.date !== todayStr);

  return (
    <div className="space-y-5">

      {/* Header / Today banner */}
      {todayTasks.length > 0 ? (
        <div className="rounded-lg border-l-2 border-l-[var(--brand)] bg-card p-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{greeting}，{name}</p>
            <p className="font-semibold text-sm">
              今日有 <span className="text-[var(--brand)] font-black font-mono">{todayTasks.length}</span> 個工作項目
            </p>
            <div className="mt-3 space-y-1.5">
              {todayTasks.map(t => {
                const Icon = TASK_ICONS[t.type];
                return (
                  <Link key={t.id} href={`/leads/${t.lead.id}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">{t.lead.storeName}</span>
                    <span className="text-xs">{t.lead.district}</span>
                    {t.time && <span className="text-xs ml-auto">{formatApptTime(t.time)}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{greeting}，{name}</p>
          <h1 className="text-xl font-bold tracking-tight">個人業績</h1>
        </div>
      )}

      {/* Stats */}
      <StatCards cards={statCards} />

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

      {/* Upcoming tasks */}
      {futureTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            未來 7 日工作項目
          </h2>
          <ol className="space-y-1.5">
            {futureTasks.map(t => {
              const Icon = TASK_ICONS[t.type];
              return (
                <li key={t.id}>
                  <Link href={`/leads/${t.lead.id}`}
                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-accent transition-colors">
                    <div className="shrink-0 text-center w-8">
                      <p className="text-[10px] text-muted-foreground leading-none">{t.date.slice(5, 7)}月</p>
                      <p className="text-lg font-black font-mono leading-tight">{parseInt(t.date.slice(8, 10))}</p>
                    </div>
                    <div className="w-px h-8 bg-border shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{t.lead.storeName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Icon className="h-3 w-3" />
                        {t.lead.district}
                      </p>
                    </div>
                    {t.time && (
                      <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <Clock className="h-3 w-3" />
                        {formatApptTime(t.time)}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <p className="text-[10px] text-muted-foreground">只顯示分配給你的商戶數據</p>
    </div>
  );
}
