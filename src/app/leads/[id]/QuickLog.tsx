"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityType } from "@/generated/prisma/enums";
import { ACTIVITY_LABELS } from "@/lib/constants";
import { createActivity } from "./actions";
import { cn } from "@/lib/utils";

const QUICK_LOG_BUTTONS: { type: ActivityType; bgClass: string; label: string; icon: string }[] = [
  {
    type: "WALK_IN",
    icon: "🚶",
    label: "Walk-in 拜訪",
    bgClass: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200",
  },
  {
    type: "PHONE",
    icon: "📞",
    label: "打電話",
    bgClass: "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 active:bg-blue-200",
  },
  {
    type: "WHATSAPP",
    icon: "💬",
    label: "WhatsApp",
    bgClass: "border-green-300 bg-green-50 text-green-800 hover:bg-green-100 active:bg-green-200",
  },
];

export function QuickLog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpen(type: ActivityType) {
    setSelectedType(type);
    setNotes("");
    setError("");
    setOpen(true);
  }

  function handleSave() {
    if (!selectedType) return;
    setError("");
    startTransition(async () => {
      const result = await createActivity(leadId, selectedType, notes);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  const meta = selectedType ? ACTIVITY_LABELS[selectedType] : null;

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-base font-semibold">3 秒快速記錄</h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_LOG_BUTTONS.map(({ type, icon, label, bgClass }) => (
            <button
              key={type}
              onClick={() => handleOpen(type)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-5 font-medium transition-all",
                bgClass
              )}
            >
              <span className="text-3xl leading-none">{icon}</span>
              <span className="text-xs leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => document.getElementById("appointment-section")?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 active:bg-amber-200 py-3.5 font-medium transition-all"
        >
          <span className="text-xl leading-none">📅</span>
          <span className="text-sm font-semibold">約 Meeting / 設定下次跟進</span>
        </button>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {meta?.icon} {meta?.zh} — 備忘錄
            </DialogTitle>
          </DialogHeader>

          <Textarea
            placeholder="今次跟進情況… (例：已見老闆，傾好九折，下週再跟進)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="resize-none"
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-500 active:bg-green-700 text-white"
            >
              {isPending ? "儲存中…" : "儲存記錄"}
            </Button>
            <DialogClose asChild>
              <Button className="w-full h-14 text-base font-bold bg-red-600 hover:bg-red-500 active:bg-red-700 text-white">
                取消
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
