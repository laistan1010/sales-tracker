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
import { MapPin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteLead } from "./actions";

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
}

interface DeleteDialogProps {
  storeName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteDialog({ storeName, onConfirm, onCancel, isPending }: DeleteDialogProps) {
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

export function LeadsClient({ leads, filterType, filterValue, isAdmin }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [districtFilter, setDistrictFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<LeadWithUser | null>(null);
  const [isPending, startTransition] = useTransition();

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
      if (value === "all") {
        params.delete("filter");
      } else {
        params.set("filter", value);
      }
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

  const filterOptions =
    filterType === "industry"
      ? [
          { value: "all", label: "全部" },
          ...ALL_INDUSTRIES.map((k) => ({ value: k, label: INDUSTRY_LABELS[k].zh })),
        ]
      : [
          { value: "all", label: "全部" },
          ...ALL_STATUSES.map((k) => ({ value: k, label: STATUS_LABELS[k].zh })),
        ];

  const visibleLeads =
    districtFilter === "all"
      ? leads
      : leads.filter((l) => l.district === districtFilter);

  return (
    <div className="space-y-4">
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
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">全部地鐵站 / 區份</option>
          {HK_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {districtFilter !== "all" && (
          <button
            onClick={() => setDistrictFilter("all")}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground underline"
          >
            清除
          </button>
        )}
      </div>

      {/* ── Filter type toggle ──────────────────────────────────────── */}
      <div className="flex gap-2 rounded-xl border bg-muted p-1 text-sm font-medium">
        {(["industry", "status"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setParam("by", type)}
            className={cn(
              "flex-1 rounded-lg py-2 text-center transition-colors",
              filterType === type
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {type === "industry" ? "行業" : "Pipeline"}
          </button>
        ))}
      </div>

      {/* ── Filter value chips ──────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterOptions.map(({ value, label }) => {
          const activeSet = filterValue === "all" ? ["all"] : filterValue.split(",");
          const isActive = activeSet.includes(value) || (value === "all" && filterValue === "all");
          let chipColor = "";
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

      {/* ── Count ───────────────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground">
        {visibleLeads.length} 間商戶
        {districtFilter !== "all" && (
          <span className="ml-1">· {districtFilter}</span>
        )}
      </p>

      {/* ── Lead grid ───────────────────────────────────────────────── */}
      {visibleLeads.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          {districtFilter !== "all"
            ? `${districtFilter} 暫無商戶`
            : "沒有符合的商戶"}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {visibleLeads.map((lead) => {
            const statusMeta = STATUS_LABELS[lead.status];
            return (
              <li key={lead.id} className="relative">
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex flex-col gap-1.5 rounded-xl border bg-card p-3 shadow-sm transition-colors active:bg-accent h-full"
                >
                  <p className="truncate font-semibold text-sm leading-tight pr-5">
                    {lead.storeName}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{lead.district}</span>
                  </span>
                  <span
                    className={cn(
                      "self-start inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                      statusMeta.color
                    )}
                  >
                    {statusMeta.zh}
                  </span>
                  {isAdmin && lead.assignedTo && (
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.assignedTo.name}
                    </p>
                  )}
                </Link>

                {/* Delete button — admin only */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteTarget(lead);
                    }}
                    className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors"
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
    </div>
  );
}
