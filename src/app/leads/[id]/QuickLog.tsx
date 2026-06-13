"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, MessageSquare } from "lucide-react";
import type { ActivityType } from "@/generated/prisma/enums";
import { ACTIVITY_LABELS } from "@/lib/constants";
import { createActivity } from "./actions";
import { cn } from "@/lib/utils";

const QUICK_LOG_BUTTONS: {
  type:    ActivityType;
  icon:    React.ElementType;
  label:   string;
  bgClass: string;
}[] = [
  {
    type:    "WALK_IN",
    icon:    MapPin,
    label:   "Walk-in 拜訪",
    bgClass: "border-orange-400 bg-orange-200 text-orange-900 hover:bg-orange-300 active:bg-orange-400 dark:bg-orange-900/40 dark:border-orange-600 dark:text-orange-100",
  },
  {
    type:    "PHONE",
    icon:    Phone,
    label:   "打電話",
    bgClass: "border-orange-400 bg-orange-200 text-orange-900 hover:bg-orange-300 active:bg-orange-400 dark:bg-orange-900/40 dark:border-orange-600 dark:text-orange-100",
  },
  {
    type:    "WHATSAPP",
    icon:    MessageSquare,
    label:   "WhatsApp",
    bgClass: "border-orange-400 bg-orange-200 text-orange-900 hover:bg-orange-300 active:bg-orange-400 dark:bg-orange-900/40 dark:border-orange-600 dark:text-orange-100",
  },
];

const PRESETS: Record<ActivityType, string[]> = {
  WALK_IN: [
    "負責人不在",
    "叫我下次再嚟",
    "已取聯絡方式",
    "無興趣",
    "留下宣傳品",
    "已約下次拜訪",
  ],
  PHONE: [
    "無人接聽",
    "對方忙碌",
    "已約好見面",
    "已留言",
    "改期再致電",
  ],
  WHATSAPP: [
    "已發介紹訊息",
    "已發產品資料",
    "已發建議書",
    "已發至電郵",
    "已讀不回",
    "未送達",
  ],
  // unused types — empty so the type is satisfied
  PIPELINE: [],
  MEETING:  [],
  EMAIL:    [],
};

export function QuickLog({ leadId }: { leadId: string }) {
  const [open,          setOpen]         = useState(false);
  const [selectedType,  setSelectedType] = useState<ActivityType | null>(null);
  const [selectedChip,  setSelectedChip] = useState<string | null>(null);
  const [notes,         setNotes]        = useState("");
  const [error,         setError]        = useState("");
  const [isPending,     startTransition] = useTransition();

  function handleOpen(type: ActivityType) {
    setSelectedType(type);
    setSelectedChip(null);
    setNotes("");
    setError("");
    setOpen(true);
  }

  function handleChip(preset: string) {
    if (selectedChip === preset) {
      // deselect — clear the prefilled text, keep any extra notes typed after
      setSelectedChip(null);
      setNotes(prev => prev.startsWith(preset) ? prev.slice(preset.length).trimStart() : prev);
    } else {
      // replace previous chip prefix, keep anything the user typed after
      const extra = selectedChip && notes.startsWith(selectedChip)
        ? notes.slice(selectedChip.length).trimStart()
        : notes;
      setSelectedChip(preset);
      setNotes(extra ? `${preset} — ${extra}` : preset);
    }
  }

  function handleNotesChange(val: string) {
    setNotes(val);
    // if the user clears the chip text manually, deselect the chip
    if (selectedChip && !val.startsWith(selectedChip)) {
      setSelectedChip(null);
    }
  }

  function handleSave() {
    if (!selectedType) return;
    setError("");
    startTransition(async () => {
      const result = await createActivity(leadId, selectedType, notes);
      if (result?.error) { setError(result.error); return; }
      setOpen(false);
    });
  }

  const meta      = selectedType ? ACTIVITY_LABELS[selectedType] : null;
  const ModalIcon = selectedType
    ? QUICK_LOG_BUTTONS.find(b => b.type === selectedType)?.icon
    : null;
  const presets   = selectedType ? (PRESETS[selectedType] ?? []) : [];

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-base font-semibold">3 秒快速記錄</h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_LOG_BUTTONS.map(({ type, icon: Icon, label, bgClass }) => (
            <button
              key={type}
              onClick={() => handleOpen(type)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-5 font-medium transition-all",
                bgClass
              )}
            >
              <Icon className="h-7 w-7" />
              <span className="text-xs leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {ModalIcon && <ModalIcon className="h-4 w-4 text-[var(--brand)]" />}
              {meta?.zh} — 備忘錄
            </DialogTitle>
          </DialogHeader>

          {/* Quick-select chips */}
          {presets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {presets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleChip(preset)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    selectedChip === preset
                      ? "border-[var(--brand)] bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100"
                      : "border-border bg-background text-foreground hover:border-[var(--brand)] hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          <Textarea
            placeholder="補充備忘… （選填）"
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={3}
            className="resize-none"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isPending || (!notes.trim() && !selectedChip)}
              className="w-full h-14 text-base font-bold bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white disabled:opacity-40"
            >
              {isPending ? "儲存中…" : "儲存記錄"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="w-full h-14 text-base font-bold">
                取消
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
