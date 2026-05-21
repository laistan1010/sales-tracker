"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Lead, User } from "@/generated/prisma/client";
import type { LeadStatus } from "@/generated/prisma/enums";
import {
  ALL_INDUSTRIES,
  ALL_STATUSES,
  INDUSTRY_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { MapPin, Trash2, UserCheck, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteLead, assignLeads } from "./actions";

const HK_DISTRICTS = [
  "尖沙咀", "旺角", "油麻地", "佐敦", "深水埗",
  "銅鑼灣", "中環", "上環", "灣仔",
  "觀塘", "荃灣", "元朗", "沙田",
  "港島區 (其他)", "九龍區 (其他)", "新界區 (其他)",
];

type LeadWithUser = Lead & { assignedTo: User | null };

interface Props {
  leads: LeadWithUser[];
  filterType: "industry" | "status";
  filterValue: string;
  isAdmin: boolean;
  salesUsers: User[];
}

function DeleteDialog({
  storeName,
  onConfirm,
  onCancel,
  isPending,
}: {
  storeName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-card border shadow-xl p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold">確認刪除商戶？</h3>
          <p className="text-sm text-muted-foreground">
            「{storeName}」連同所有聯絡人、跟進記錄及任務將被永久刪除，此操作不可撤銷。
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 h-11 rounded-xl border font-medium text-sm hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "刪除中…" : "確認刪除"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LeadsClient({ leads, filterType, filterValue, isAdmin, salesUsers }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [districtFilter, setDistrictFilter] = useState("all");
  const [deleteTarget, setDeleteTarget]     = useState<LeadWithUser | null>(null);
  const [isPending, startTransition]        = useTransition();

  const [selectedIds, setSelectedIds]           = useState<Set<string>>(new Set());
  const [assignTargetId, setAssignTargetId]     = useState("");
  const [isAssigning, startAssignTransition]    = useTransition();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      if (key === "by") params.delete("filter");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const setFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") params.delete("filter");
      else params.set("filter", value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteLead(deleteTarget.id);
      setDeleteTarget(null);
    });
  }

  function toggleSelect(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(visibleLeads.map(l => l.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setAssignTargetId("");
  }

  function handleAssign() {
    if (!assignTargetId || !selectedIds.size) return;
    startAssignTransition(async () => {
      await assignLeads(Array.from(selectedIds), assignTargetId);
      clearSelection();
    });
  }

  const filterOptions =
    filterType === "industry"
      ? [{ value: "all", label: "全部" }, ...ALL_INDUSTRIES.map(k => ({ value: k, label: INDUSTRY_LABELS[k].zh }))]
      : [{ value: "all", label: "全部" }, ...ALL_STATUSES.map(k => ({ value: k, label: STATUS_LABELS[k].zh }))];

  const visibleLeads =
    districtFilter === "all" ? leads : leads.filter(l => l.district === districtFilter);

  const allSelected = visibleLeads.length > 0 && visibleLeads.every(l => selectedIds.has(l.id));
  const hasSelection = selectedIds.size > 0;

  return (
    <div className={cn("space-y-4", hasSelection && "pb-28")}>
      {deleteTarget && (
        <DeleteDialog
          storeName={deleteTarget.storeName}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isPending={isPending}
        />
      )}

      {/* ── District filter ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
        <select
          value={districtFilter}
          onChange={e => setDistrictFilter(e.target.value)}
          className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">全部地鐵站 / 區份</option>
          {HK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {districtFilter !== "all" && (
          <button onClick={() => setDistrictFilter("all")} className="shrink-0 text-xs text-muted-foreground hover:text-foreground underline">
            清除
          </button>
        )}
      </div>

      {/* ── Filter type toggle ──────────────────────────────────────── */}
      <div className="flex gap-2 rounded-xl border bg-muted p-1 text-sm font-medium">
        {(["industry", "status"] as const).map(type => (
          <button
            key={type}
            onClick={() => setParam("by", type)}
            className={cn(
              "flex-1 rounded-lg py-2 text-center transition-colors",
              filterType === type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {type === "industry" ? "行業" : "Pipeline"}
          </button>
        ))}
      </div>

      {/* ── Filter chips ────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterOptions.map(({ value, label }) => {
          const activeSet = filterValue === "all" ? ["all"] : filterValue.split(",");
          const isActive  = activeSet.includes(value) || (value === "all" && filterValue === "all");
          let chipColor   = "";
          if (value !== "all" && filterType === "industry")
            chipColor = INDUSTRY_LABELS[value as keyof typeof INDUSTRY_LABELS]?.color ?? "";
          if (value !== "all" && filterType === "status")
            chipColor = STATUS_LABELS[value as LeadStatus]?.color ?? "";
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-all",
                isActive
                  ? chipColor || "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Count + select-all ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {visibleLeads.length} 間商戶
          {districtFilter !== "all" && <span className="ml-1">· {districtFilter}</span>}
          {hasSelection && (
            <span className="ml-2 font-medium" style={{ color: "#fed7aa" }}>
              · 已選 {selectedIds.size} 間
            </span>
          )}
        </p>
        {isAdmin && visibleLeads.length > 0 && (
          <button
            onClick={allSelected ? clearSelection : selectAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSelected
              ? <><CheckSquare className="h-3.5 w-3.5" style={{ color: "#fed7aa" }} />取消全選</>
              : <><Square className="h-3.5 w-3.5" />全選</>
            }
          </button>
        )}
      </div>

      {/* ── Lead grid ───────────────────────────────────────────────── */}
      {visibleLeads.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          {districtFilter !== "all" ? `${districtFilter} 暫無商戶` : "沒有符合的商戶"}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {visibleLeads.map(lead => {
            const statusMeta = STATUS_LABELS[lead.status];
            const isSelected = selectedIds.has(lead.id);
            return (
              <li key={lead.id} className="relative">
                <div
                  className={cn(
                    "rounded-xl border overflow-hidden transition-all",
                    isSelected
                      ? "bg-card"
                      : "bg-card"
                  )}
                  style={isSelected ? {
                    borderColor: "#fed7aa",
                    boxShadow: "0 0 0 2px rgba(253,215,170,0.25)",
                  } : {}}
                >
                  <div className="flex">
                    {/* ── Checkbox strip (admin only) ── */}
                    {isAdmin && (
                      <button
                        onClick={e => toggleSelect(e, lead.id)}
                        className={cn(
                          "flex w-10 shrink-0 items-center justify-center transition-colors border-r",
                          isSelected
                            ? "border-r-orange-200/50"
                            : "border-r-border hover:bg-muted"
                        )}
                        style={isSelected ? { background: "rgba(253,215,170,0.08)" } : {}}
                        aria-label={isSelected ? "取消選擇" : "選擇商戶"}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4" style={{ color: "#fed7aa" }} />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    )}

                    {/* ── Card content (links to detail) ── */}
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex flex-col gap-1.5 p-3 flex-1 min-w-0 active:bg-accent"
                      style={{ paddingRight: isAdmin ? "2rem" : "0.75rem" }}
                    >
                      <p className="truncate font-semibold text-sm leading-tight">
                        {lead.storeName}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lead.district}</span>
                      </span>
                      <span className={cn(
                        "self-start inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                        statusMeta.color
                      )}>
                        {statusMeta.zh}
                      </span>
                      {isAdmin && lead.assignedTo && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.assignedTo.name}
                        </p>
                      )}
                    </Link>
                  </div>
                </div>

                {/* Delete button */}
                {isAdmin && (
                  <button
                    onClick={e => { e.preventDefault(); setDeleteTarget(lead); }}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors"
                    aria-label="刪除商戶"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Bulk assign bar ─────────────────────────────────────────── */}
      {isAdmin && hasSelection && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm shadow-lg px-4 py-3">
          <div className="mx-auto max-w-2xl flex items-center gap-3">
            <UserCheck className="h-5 w-5 shrink-0" style={{ color: "#fed7aa" }} />
            <span className="text-sm font-medium shrink-0">
              已選{" "}
              <span className="font-bold" style={{ color: "#fed7aa" }}>{selectedIds.size}</span>{" "}
              間
            </span>
            <select
              value={assignTargetId}
              onChange={e => setAssignTargetId(e.target.value)}
              className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
            >
              <option value="">選擇負責人…</option>
              {salesUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!assignTargetId || isAssigning}
              className="shrink-0 h-10 px-4 rounded-lg bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-sm font-bold transition-colors disabled:opacity-40"
            >
              {isAssigning ? "指派中…" : "確認"}
            </button>
            <button
              onClick={clearSelection}
              disabled={isAssigning}
              className="shrink-0 h-10 px-3 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
