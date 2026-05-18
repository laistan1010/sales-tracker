"use client";

import { useState, useEffect, useActionState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";
import { setAppointment, clearAppointment } from "./actions";
import { cn } from "@/lib/utils";

interface Props {
  leadId:       string;
  initialDate:  string | null;
  initialTime:  string | null;
  initialNotes: string | null;
}

function formatDate(d: string) {
  const [, m, day] = d.split("-");
  return `${parseInt(m)}月${parseInt(day)}日`;
}

function formatTime(t: string) {
  const [h, min] = t.split(":").map(Number);
  const period = h >= 12 ? "下午" : "上午";
  const hour   = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${period} ${hour}:${String(min).padStart(2, "0")}`;
}

function getDateStatus(d: string): "today" | "past" | "future" {
  const nowHK    = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const todayStr = nowHK.toISOString().slice(0, 10);
  if (d < todayStr) return "past";
  if (d === todayStr) return "today";
  return "future";
}

export function AppointmentSection({ leadId, initialDate, initialTime, initialNotes }: Props) {
  const [open,         setOpen]         = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing,   startClear]      = useTransition();

  const boundAction = setAppointment.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if ((state as { success?: boolean }).success) setOpen(false);
  }, [state]);

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
      return;
    }
    startClear(async () => {
      await clearAppointment(leadId);
      setConfirmClear(false);
    });
  }

  const hasAppt    = !!initialDate;
  const dateStatus = initialDate ? getDateStatus(initialDate) : null;

  return (
    <section id="appointment-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">📅 下次跟進預約</h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8 text-xs"
          onClick={() => setOpen(true)}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {hasAppt ? "修改預約" : "設定預約"}
        </Button>
      </div>

      {/* ── Display ─────────────────────────────────────────────── */}
      {!hasAppt ? (
        <p className="rounded-xl border border-dashed bg-card p-4 text-center text-sm text-muted-foreground">
          尚未設定跟進預約 — 點擊右上角「設定預約」
        </p>
      ) : (
        <div className={cn(
          "rounded-xl border bg-card p-4",
          dateStatus === "today" && "border-amber-400 bg-amber-50 dark:bg-amber-950/20",
          dateStatus === "past"  && "border-muted opacity-60",
        )}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              {dateStatus === "today" && (
                <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  🔔 今日
                </span>
              )}
              {dateStatus === "past" && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  已過期
                </span>
              )}
              <p className="text-lg font-bold">
                {formatDate(initialDate!)}
                {initialTime && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {formatTime(initialTime)}
                  </span>
                )}
              </p>
              {initialNotes && (
                <p className="text-sm text-muted-foreground">{initialNotes}</p>
              )}
            </div>

            {/* Two-step clear */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isClearing}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                confirmClear
                  ? "animate-pulse bg-red-500 text-white"
                  : "border border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {isClearing ? "清除中…" : confirmClear ? "確定取消？" : "取消預約"}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              📅 {hasAppt ? "修改" : "設定"}下次跟進預約
            </DialogTitle>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  日期 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  name="date"
                  defaultValue={initialDate ?? ""}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  時間{" "}
                  <span className="text-muted-foreground font-normal text-xs">（選填）</span>
                </Label>
                <Input
                  type="time"
                  name="time"
                  defaultValue={initialTime ?? ""}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                地點 / 備忘{" "}
                <span className="text-muted-foreground font-normal text-xs">（選填）</span>
              </Label>
              <Input
                name="notes"
                defaultValue={initialNotes ?? ""}
                placeholder="例：帶報價單、於分店二樓見…"
              />
            </div>

            {(state as { error?: string }).error && (
              <p className="text-sm text-destructive">{(state as { error?: string }).error}</p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-500 active:bg-green-700 text-white"
              >
                {isPending ? "儲存中…" : "確認預約"}
              </Button>
              <DialogClose asChild>
                <Button className="w-full h-14 text-base font-bold bg-red-600 hover:bg-red-500 active:bg-red-700 text-white">
                  取消
                </Button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
