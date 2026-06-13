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
import { ClipboardList, Users, Phone, Mail, Bell } from "lucide-react";
import { createTask, deleteTask, completeTask } from "./actions";
import { cn } from "@/lib/utils";
import type { TaskType } from "@/generated/prisma/enums";

const TASK_TYPES: { type: TaskType; icon: React.ElementType; zh: string }[] = [
  { type: "MEETING", icon: Users,  zh: "面談" },
  { type: "CALL",    icon: Phone,  zh: "電話" },
  { type: "EMAIL",   icon: Mail,   zh: "電郵" },
];

interface Task {
  id:    string;
  type:  TaskType;
  date:  string;
  time:  string | null;
  notes: string | null;
}

function getHKToday() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getDateStatus(d: string): "today" | "past" | "future" {
  const today = getHKToday();
  if (d < today) return "past";
  if (d === today) return "today";
  return "future";
}

function formatDate(d: string): string {
  const today = getHKToday();
  if (d === today) return "今日";
  const [, m, day] = d.split("-");
  return `${parseInt(m)}月${parseInt(day)}日`;
}

function formatTime(t: string) {
  const [h, min] = t.split(":").map(Number);
  const period = h >= 12 ? "下午" : "上午";
  const hour   = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${period} ${hour}:${String(min).padStart(2, "0")}`;
}

function TaskCard({ task, leadId }: { task: Task; leadId: string }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting,   startDelete]   = useTransition();
  const [isCompleting, startComplete] = useTransition();

  const status = getDateStatus(task.date);
  const meta   = TASK_TYPES.find(t => t.type === task.type)!;
  const Icon   = meta.icon;

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 5000);
      return;
    }
    startDelete(async () => {
      await deleteTask(leadId, task.id);
      setConfirmDelete(false);
    });
  }

  function handleComplete() {
    startComplete(async () => {
      await completeTask(leadId, task.id);
    });
  }

  return (
    <div className={cn(
      "rounded-xl border bg-card p-3",
      status === "today" && "border-amber-400 bg-amber-50 dark:bg-amber-950/20",
      status === "past"  && "border-muted opacity-60",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {status === "today" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                <Bell className="h-3 w-3" /> 今日
              </span>
            )}
            {status === "past" && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                已過期
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs font-medium">
              <Icon className="h-3.5 w-3.5" /> {meta.zh}
            </span>
          </div>
          <p className="text-base font-bold">
            {formatDate(task.date)}
            {task.time && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {formatTime(task.time)}
              </span>
            )}
          </p>
          {task.notes && (
            <p className="text-sm text-muted-foreground">{task.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleComplete}
            disabled={isCompleting || isDeleting}
            className="rounded-lg px-2.5 py-1 text-xs font-medium border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:bg-orange-900/20 disabled:opacity-50 transition-colors"
          >
            {isCompleting ? "…" : "✓ 完成"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isCompleting}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              confirmDelete
                ? "animate-pulse bg-red-500 text-white"
                : "border border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {isDeleting ? "…" : confirmDelete ? "確定刪除？" : "刪除"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  leadId:       string;
  initialTasks: Task[];
}

export function TaskSection({ leadId, initialTasks }: Props) {
  const [open,         setOpen]         = useState(false);
  const [selectedType, setSelectedType] = useState<TaskType>("MEETING");

  const boundAction = createTask.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if ((state as { success?: boolean }).success) {
      setOpen(false);
      setSelectedType("MEETING");
    }
  }, [state]);

  const sorted = [...initialTasks].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <section id="task-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-base font-semibold">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          工作項目
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8 text-xs"
          onClick={() => setOpen(true)}
        >
          + 新增
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-4 text-center text-sm text-muted-foreground">
          尚未安排工作項目 — 點擊右上角「新增」
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map(task => (
            <TaskCard key={task.id} task={task} leadId={leadId} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[var(--brand)]" />
              新增工作項目
            </DialogTitle>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label>類型 <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {TASK_TYPES.map(({ type, icon: Icon, zh }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-medium transition-colors",
                      selectedType === type
                        ? "border-[var(--brand)] bg-orange-50 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100"
                        : "border-border bg-background hover:bg-accent"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      selectedType === type ? "text-[var(--brand)]" : "text-muted-foreground"
                    )} />
                    <span>{zh}</span>
                  </button>
                ))}
              </div>
              <input type="hidden" name="type" value={selectedType} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>日期 <span className="text-destructive">*</span></Label>
                <Input type="date" name="date" required />
              </div>
              <div className="space-y-1.5">
                <Label>
                  時間{" "}
                  <span className="text-muted-foreground font-normal text-xs">（選填）</span>
                </Label>
                <Input type="time" name="time" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                備忘{" "}
                <span className="text-muted-foreground font-normal text-xs">（選填）</span>
              </Label>
              <Input name="notes" placeholder="例：帶報價單、致電確認訂座…" />
            </div>

            {(state as { error?: string }).error && (
              <p className="text-sm text-destructive">{(state as { error?: string }).error}</p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-14 text-base font-bold bg-[var(--brand)] hover:bg-[var(--brand)]/90 active:bg-[var(--brand)]/80 text-white"
              >
                {isPending ? "新增中…" : "確認新增"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full h-14 text-base font-bold">
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
