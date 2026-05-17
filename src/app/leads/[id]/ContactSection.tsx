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
import { createContact } from "./actions";
import { useState } from "react";

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
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-semibold">{c.name}</span>
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
                  className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 transition-colors hover:bg-blue-100 active:bg-blue-200"
                >
                  <Phone className="h-4 w-4 shrink-0 text-blue-600" />
                  <span className="text-base font-bold tracking-wide text-blue-700">
                    {c.phone}
                  </span>
                  <span className="ml-auto text-xs text-blue-500">點擊撥打</span>
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

            <DialogFooter className="gap-2 pt-1">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1">取消</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "儲存中…" : "儲存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
