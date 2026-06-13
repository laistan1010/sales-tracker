"use client";

import { useEffect, useRef, useState, useActionState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Zap } from "lucide-react";
import { createLead, type ActionState } from "./actions";
import { ALL_INDUSTRIES, INDUSTRY_LABELS, HK_DISTRICTS } from "@/lib/constants";

const initial: ActionState = {};

export function CreateLeadModal() {
  const [open, setOpen]         = useState(false);
  const [industry, setIndustry] = useState("");
  const [district, setDistrict] = useState("");
  const [state, formAction, isPending] = useActionState(createLead, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setIndustry("");
      setDistrict("");
      formRef.current?.reset();
    }
  }, [state.success]);

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) { setIndustry(""); setDistrict(""); formRef.current?.reset(); }
  }

  const fe = state.fieldErrors ?? {};

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5 shrink-0">
        <Plus className="h-4 w-4" />
        新增商戶
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              極速建檔
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground -mt-1">
            3 個欄位即完成建檔，詳細地址與聯絡人可在詳細頁隨時補填。
          </p>

          <form ref={formRef} action={formAction} className="space-y-4">
            {/* Hidden inputs carry Select values into FormData */}
            <input type="hidden" name="industry" value={industry} />
            <input type="hidden" name="district" value={district} />

            {/* ① Store Name */}
            <div className="space-y-1">
              <Label>店名 *</Label>
              <Input
                name="storeName"
                placeholder="例：Happy Foot 旺角店"
                autoFocus
              />
              {fe.storeName && (
                <p className="text-xs text-destructive">{fe.storeName}</p>
              )}
            </div>

            {/* ② Industry */}
            <div className="space-y-1">
              <Label>行業 *</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇行業" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_INDUSTRIES.map((k) => (
                    <SelectItem key={k} value={k}>
                      {INDUSTRY_LABELS[k].zh} · {INDUSTRY_LABELS[k].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fe.industry && (
                <p className="text-xs text-destructive">{fe.industry}</p>
              )}
            </div>

            {/* ③ District / MTR Station */}
            <div className="space-y-1">
              <Label>區份 / 地鐵站 *</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇區份 / 地鐵站" />
                </SelectTrigger>
                <SelectContent>
                  {HK_DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fe.district && (
                <p className="text-xs text-destructive">{fe.district}</p>
              )}
            </div>

            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={isPending} className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-500 active:bg-green-700 text-white">
                {isPending ? "建立中…" : "立即建立"}
              </Button>
              <DialogClose asChild>
                <Button type="button" className="w-full h-14 text-base font-bold bg-red-600 hover:bg-red-500 active:bg-red-700 text-white">
                  取消
                </Button>
              </DialogClose>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
