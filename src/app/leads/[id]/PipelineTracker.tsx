"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { LeadStatus } from "@/generated/prisma/enums";
import { updateLeadStatus } from "./actions";

interface Props {
  leadId:         string;
  currentStatus:  LeadStatus;
  objectionNotes: string | null;
}

const STAGES: { id: LeadStatus; label: string; activeColor: string }[] = [
  { id: "LEAD",        label: "潛在客戶", activeColor: "bg-zinc-600    text-white border-zinc-600"    },
  { id: "CONTACTED",   label: "已接觸",   activeColor: "bg-orange-300  text-orange-900 border-orange-300" },
  { id: "DEMO",        label: "提案中",   activeColor: "bg-orange-500  text-white border-orange-500"  },
  { id: "OBJECTION",   label: "處理反對", activeColor: "bg-orange-600  text-white border-orange-600"  },
  { id: "CLOSED_WON",  label: "成交",     activeColor: "bg-orange-700  text-white border-orange-700"  },
  { id: "CLOSED_LOST", label: "失敗",     activeColor: "bg-zinc-600    text-white border-zinc-600"    },
];

const STAGE_INDEX: Record<LeadStatus, number> = {
  LEAD: 0, CONTACTED: 1, DEMO: 2, OBJECTION: 3, CLOSED_WON: 4, CLOSED_LOST: 5,
};

function getProgressBar(status: LeadStatus): { pct: number; color: string } {
  switch (status) {
    case "LEAD":        return { pct: 16,  color: "bg-orange-300" };
    case "CONTACTED":   return { pct: 33,  color: "bg-orange-400" };
    case "DEMO":        return { pct: 50,  color: "bg-orange-500" };
    case "OBJECTION":   return { pct: 66,  color: "bg-orange-600" };
    case "CLOSED_WON":  return { pct: 100, color: "bg-orange-700" };
    case "CLOSED_LOST": return { pct: 100, color: "bg-zinc-500"   };
  }
}

export function PipelineTracker({ leadId, currentStatus, objectionNotes }: Props) {
  const [optimisticStatus, setOptimisticStatus] = useState<LeadStatus>(currentStatus);
  const [notes,            setNotes]            = useState(objectionNotes ?? "");
  const [isSavingNotes,    setIsSavingNotes]    = useState(false);
  const [isPending,        startTransition]     = useTransition();

  const { pct, color } = getProgressBar(optimisticStatus);
  const showNotes = optimisticStatus === "OBJECTION" || optimisticStatus === "CLOSED_LOST";

  function handleStageClick(newStatus: LeadStatus) {
    if (newStatus === optimisticStatus || isPending) return;
    const prev = optimisticStatus;
    setOptimisticStatus(newStatus);
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, prev, newStatus);
      if (!result.success) {
        setOptimisticStatus(prev);
        toast.error("更新失敗，請重試");
      } else {
        toast.success("Pipeline 已更新");
      }
    });
  }

  async function handleSaveNotes() {
    setIsSavingNotes(true);
    const result = await updateLeadStatus(leadId, optimisticStatus, optimisticStatus, notes);
    setIsSavingNotes(false);
    if (result.success) toast.success("原因已儲存");
    else toast.error("儲存失敗，請重試");
  }

  return (
    <div className="w-full bg-card border rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
          Sales Pipeline
        </h3>
        {isPending && (
          <div className="animate-spin h-4 w-4 border-2 border-[var(--brand)] border-t-transparent rounded-full" />
        )}
      </div>

      {/* Stage buttons */}
      <div className="relative grid grid-cols-2 md:grid-cols-6 gap-2">
        {STAGES.map((stage) => {
          const isActive = optimisticStatus === stage.id;
          const isPast   = STAGE_INDEX[optimisticStatus] > STAGE_INDEX[stage.id];
          return (
            <button
              key={stage.id}
              type="button"
              disabled={isPending}
              onClick={() => handleStageClick(stage.id)}
              className={[
                "py-4 px-2 text-sm font-medium rounded-xl border transition-all duration-200 text-center",
                isActive
                  ? stage.activeColor + " shadow-sm font-semibold scale-[1.02]"
                  : isPast
                    ? "bg-muted/40 text-muted-foreground border-border opacity-60 hover:opacity-90"
                    : "bg-muted/20 text-muted-foreground border-border hover:bg-muted/50 hover:border-foreground/20",
              ].join(" ")}
            >
              {stage.label}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: pct + "%" }}
        />
      </div>

      {/* Objection / Lost notes */}
      {showNotes && (
        <div className="pt-4 border-t border-dashed border-border space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className={`h-2 w-2 rounded-full shrink-0 ${
              optimisticStatus === "CLOSED_LOST" ? "bg-zinc-500" : "bg-orange-500"
            }`} />
            {optimisticStatus === "CLOSED_LOST" ? "失敗原因" : "客戶反對意見 / 痛點"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveNotes()}
              placeholder={optimisticStatus === "CLOSED_LOST" ? "例：已選用競爭對手…" : "例：嫌貴、需要再考慮…"}
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <button
              type="button"
              disabled={isSavingNotes}
              onClick={handleSaveNotes}
              className="px-4 py-2 bg-foreground hover:bg-foreground/90 text-background text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSavingNotes ? "儲存中…" : "儲存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
