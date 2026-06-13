"use client";

import { useEffect, useRef, useActionState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Phone, Briefcase, UserRound } from "lucide-react";
import { createContact, deleteContact } from "./actions";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  title: string | null;
  phone: string | null;
}

interface Props {
  leadId: string;
  contacts: Contact[];
}

const initial = {};

export function ContactSection({ leadId, contacts }: Props) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  async function handleDeleteClick(contactId: string) {
    if (deletingId === contactId) {
      // Second click — confirm delete
      setIsDeletingId(contactId);
      await deleteContact(leadId, contactId);
      setIsDeletingId(null);
      setDeletingId(null);
    } else {
      // First click — enter confirm state, auto-cancel after 5s
      setDeletingId(contactId);
      setTimeout(() => setDeletingId(prev => prev === contactId ? null : prev), 5000);
    }
  }

  // Bind leadId into the Server Action so FormData is the only runtime arg
  const boundAction = createContact.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, initial);

  useEffect(() => {
    if ((state as { success?: boolean }).success) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  const fe = (state as { fieldErrors?: Record<string, string> }).fieldErrors ?? {};

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">聯絡人</h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8 text-xs"
          onClick={() => setOpen(true)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          新增聯絡人
        </Button>
      </div>

      {/* Contact cards */}
      {contacts.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-4 text-center text-sm text-muted-foreground">
          尚未新增聯絡人 — 點擊右上角按鈕加入
        </p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border bg-card p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-semibold truncate">{c.name}</span>
                </div>
                {/* Two-step delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteClick(c.id)}
                  disabled={isDeletingId === c.id}
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    deletingId === c.id
                      ? "animate-pulse bg-red-500 text-white"
                      : "border border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {isDeletingId === c.id ? "刪除中…" : deletingId === c.id ? "確定刪除？" : "刪除"}
                </button>
              </div>
              {c.title && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  {c.title}
                </div>
              )}
              {c.phone && (
                <a
                  href={`tel:${c.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 transition-colors hover:bg-orange-100 active:bg-orange-200 dark:border-orange-800 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
                >
                  <Phone className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                  <span className="text-base font-bold tracking-wide text-orange-800 dark:text-orange-200">
                    {c.phone}
                  </span>
                  <span className="ml-auto text-xs text-orange-500 dark:text-orange-400">點擊撥打</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>新增聯絡人</DialogTitle>
          </DialogHeader>

          <form ref={formRef} action={formAction} className="space-y-3">
            <div className="space-y-1">
              <Label>姓名 *</Label>
              <Input name="name" placeholder="例：陳生 / Alice" autoFocus />
              {fe.name && <p className="text-xs text-destructive">{fe.name}</p>}
            </div>

            <div className="space-y-1">
              <Label>職位 <span className="text-muted-foreground font-normal">（選填）</span></Label>
              <Input name="title" placeholder="例：店長 / Marketing Manager" />
            </div>

            <div className="space-y-1">
              <Label>電話 <span className="text-muted-foreground font-normal">（選填）</span></Label>
              <Input name="phone" placeholder="例：9123 4567" inputMode="tel" />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={isPending} className="w-full h-14 text-base font-bold bg-[var(--brand)] hover:bg-[var(--brand)]/90 active:bg-[var(--brand)]/80 text-white">
                {isPending ? "儲存中…" : "儲存"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full h-14 text-base font-bold">取消</Button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
