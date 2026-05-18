"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Lead, User } from "@/generated/prisma/client";
import type { Industry, LeadStatus } from "@/generated/prisma/enums";
import {
  ALL_INDUSTRIES,
  ALL_STATUSES,
  INDUSTRY_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function LeadsClient({ leads, filterType, filterValue }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [districtFilter, setDistrictFilter] = useState("all");

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
      {/* ── District filter ─────────────────────────────────────── */}
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

      {/* ── Filter type toggle ──────────────────────────────────── */}
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

      {/* ── Filter value chips ──────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterOptions.map(({ value, label }) => {
          const activeSet = filterValue === "all" ? ["all"] : filterValue.split(",");
          const isActive = activeSet.includes(value) || (value === "all" && filterValue === "all");
          let chipColor = "";
          if (value !== "all" && filterType === "industry")
            chipColor = INDUSTRY_LABELS[value as Industry].color;
          if (value !== "all" && filterType === "status")
            chipColor = STATUS_LABELS[value as LeadStatus].color;

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

      {/* ── Count ───────────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground">
        {visibleLeads.length} 間商戶
        {districtFilter !== "all" && (
          <span className="ml-1">· {districtFilter}</span>
        )}
      </p>

      {/* ── Lead cards ──────────────────────────────────────────── */}
      <ul className="space-y-3">
        {visibleLeads.length === 0 ? (
          <li className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            {districtFilter !== "all"
              ? `${districtFilter} 暫無商戶`
              : "沒有符合的商戶"}
          </li>
        ) : (
          visibleLeads.map((lead) => {
            const industryMeta = INDUSTRY_LABELS[lead.industry];
            const statusMeta = STATUS_LABELS[lead.status];
            return (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors active:bg-accent"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <p className="truncate font-semibold leading-tight">{lead.storeName}</p>
                      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        📍 {lead.district}
                      </span>
                    </div>
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
                    {lead.address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lead.address}</span>
                      </div>
                    )}
                    {lead.assignedTo && (
                      <p className="text-xs text-muted-foreground">
                        負責：{lead.assignedTo.name}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
