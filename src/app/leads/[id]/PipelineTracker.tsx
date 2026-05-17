"use client";

import { useState, useTransition } from "react";
import type { LeadStatus } from "@/generated/prisma/enums";
import { STATUS_LABELS, ALL_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { updateLeadStatus } from "./actions";

interface Props {
  leadId:           string;
  currentStatus:    LeadStatus;
  objectionNotes:   string | null;
}

const PIPELINE_STAGES: LeadStatus[] = [
  "LEAD",
  "CONTACTED",
  "DEMO",
  "OBJECTION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

const STAGE_COLORS: Record<LeadStatus, {
  active:   string;
  inactive: string;
  dot:      string;
}> = {
  LEAD:        { active: "bg-gray-700   text-white border-gray-700",         inactive: "border-gray-300  text-gray-400  hover:border-gray-500  hover:text-gray-600",  dot: "bg-gray-500" },
  CONTACTED:   { active: "bg-blue-600   text-white border-blue-600",         inactive: "border-blue-200  text-blue-400  hover:border-blue-500  hover:text-blue-600",  dot: "bg-blue-500" },
  DEMO:        { active: "bg-purple-600 text-white border-purple-600",       inactive: "border-purple-200 text-purple-400 hover:border-purple-500 hover:text-purple-600", dot: "bg-purple-500" },
  OBJECTION:   { active: "bg-yellow-500 text-white border-yellow-500",       inactive: "border-yellow-200 text-yellow-500 hover:border-yellow-400 hover:text-yellow-600", dot: "bg-yellow-500" },
  CLOSED_WON:  { active: "bg-green-600  text-white border-green-600",        inactive: "border-green-200 text-green-400 hover:border-green-500 hover:text-green-600",   dot: "bg-green-500" },
  CLOSED_LOST: { active: "bg-red-600    text-white border-red-600",          inactive: "border-red-200   text-red-400   hover:border-red-500   hover:text-red-600",     dot: "bg-red-500" },
};

export function PipelineTracker({ leadId, currentStatus, objectionNotes }: Props) {
  const [optimisticStatus, setOptimisticStatus] = useState<LeadStatus>(currentStatus);
  const [notes, setNotes] = useState(objectionNotes ?? "");
  const [isPending, startTransition] = useTransition();

  const currentIdx = PIPELINE_STAGES.indexOf(optimisticStatus);
  const showNotes  = optimisticStatus === "OBJECTION" || optimisticStatus === "CLOSED_LOST";

  function handleStageClick(newStatus: LeadStatus) {
    if (newStatus === optimisticStatus || isPending) return;
    const prev = optimisticStatus;
    setOptimisticStatus(newStatus);
    startTransition(async () => {
      await updateLeadStatus(leadId, prev, newStatus, showNotes ? notes : undefined);
    });
  }

  function handleNotesBlur() {
    startTransition(async () => {
      await updateLeadStatus(leadId, optimisticStatus, optimisticStatus, notes);
    });
  }

  return (
    <section className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Sales Pipeline
        </h2>
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">儲存中…</span>
        )}
      </div>

      {/* Stage buttons */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PIPELINE_STAGES.map((stage, idx) => {
          const meta    = STATUS_LABELS[stage];
          const colors  = STAGE_COLORS[stage];
          const isActive = stage === optimisticStatus;
          const isPast   = idx < currentIdx;

          return (
            <button
              key={stage}
              onClick={() => handleStageClick(stage)}
              disabled={isPending}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-all",
                isActive
                  ? colors.active + " shadow-sm"
                  : isPast
                    ? "border-transparent bg-muted/50 text-muted-foreground opacity-60 hover:opacity-100 " + colors.inactive
                    : colors.inactive + " bg-background"
              )}
            >
              <span className="text-base leading-none">{meta.icon}</span>
              <span className={cn("text-[10px] font-semibold leading-tight", isActive ? "text-white" : "")}>
                {meta.zh}
              </span>
              {isActive && (
                <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot, "opacity-80")} />
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            optimisticStatus === "CLOSED_WON"  ? "bg-green-500" :
            optimisticStatus === "CLOSED_LOST" ? "bg-red-500"   : "bg-blue-500"
          )}
          style={{ width: ((currentIdx + 1) / PIPELINE_STAGES.length * 100) + "%" }}
        />
      </div>

      {/* Objection / Lost notes */}
      {showNotes && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {optimisticStatus === "OBJECTION" ? "反對意見 / 客戶顧慮" : "失敗原因"}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder={
              optimisticStatus === "OBJECTION"
                ? "例：價格太貴，需要再考慮…"
                : "例：已選用競爭對手…"
            }
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>
      )}
    </section>
  );
}
