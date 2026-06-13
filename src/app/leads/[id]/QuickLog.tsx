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
import { MapPin, Phone, MessageSquare } from "lucide-react";
import type { ActivityType } from "@/generated/prisma/enums";
import { ACTIVITY_LABELS } from "@/lib/constants";
import { createActivity } from "./actions";
import { cn } from "@/lib/utils";

const QUICK_LOG_BUTTONS: {
  type:     ActivityType;
  icon:     React.ElementType;
  label:    string;
  bgClass:  string;
}[] = [
  {
    type:    "WALK_IN",
    icon:    MapPin,
    label:   "Walk-in 拜訪",
    bgClass: "border-orange-200 bg-orange-50  text-orange-700 hover:bg-orange-100  active:bg-orange-200  dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300",
  },
  {
    type:    "PHONE",
    icon:    Phone,
    label:   "打電話",
    bgClass: "border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200  active:bg-orange-300  dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-200",
  },
  {
    type:    "WHATSAPP",
    icon:    MessageSquare,
    label:   "WhatsApp",
    bgClass: "border-orange-400 bg-orange-200 text-orange-900 hover:bg-orange-300  active:bg-orange-400  dark:bg-orange-900/40 dark:border-orange-600 dark:text-orange-100",
  },
];

export function QuickLog({ leadId }: { leadId: string }) {
  const [open,         setOpen]        = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [notes,        setNotes]        = useState("");
  const [error,        setError]        = useState("");
  const [isPending,    startTransition] = useTransition();

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
      if (result?.error) { setError(result.error); return; }
      setOpen(false);
    });
  }

  const meta      = selectedType ? ACTIVITY_LABELS[selectedType] : null;
  const ModalIcon = selectedType
    ? QUICK_LOG_BUTTONS.find(b => b.type === selectedType)?.icon
    : null;

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

          <Textarea
            placeholder="今次跟進情況… (例：已見老闆，傾好九折，下週再跟進)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="resize-none"
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full h-14 text-base font-bold bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white"
            >
              {isPending ? "儲存中…" : "儲存記錄"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="w-full h-14 text-base font-bold">
                取消
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
