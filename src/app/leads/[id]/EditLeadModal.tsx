"use client";

import { useEffect, useActionState, useState } from "react";
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
import { Pencil } from "lucide-react";
import { updateLead } from "./actions";

// Same list as CreateLeadModal for consistency
const HK_DISTRICTS = [
  // 核心地鐵站
  "尖沙咀", "旺角", "油麻地", "佐敦", "深水埗",
  "銅鑼灣", "中環", "上環", "灣仔",
  "觀塘", "荃灣", "元朗", "沙田",
  // 大區分類
  "港島區 (其他)", "九龍區 (其他)", "新界區 (其他)",
];

interface Props {
  leadId: string;
  district: string;
  address: string | null;
  googleMapsUrl: string | null;
  openRiceUrl: string | null;
  gaodeMapsUrl: string | null;
}

const initial = {};

export function EditLeadModal({
  leadId,
  district,
  address,
  googleMapsUrl,
  openRiceUrl,
  gaodeMapsUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const boundAction = updateLead.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, initial);

  useEffect(() => {
    if ((state as { success?: boolean }).success) setOpen(false);
  }, [state]);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 h-7 text-xs px-2.5"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3 w-3" />
        編輯資料
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>編輯基本資料</DialogTitle>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            {/* District */}
            <div className="space-y-1">
              <Label>區份 / 地鐵站</Label>
              <Input
                name="district"
                defaultValue={district}
                placeholder="例：旺角、銅鑼灣…"
                list="hk-districts-edit"
                autoComplete="off"
              />
              <datalist id="hk-districts-edit">
                {HK_DISTRICTS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            {/* Detailed address */}
            <div className="space-y-1">
              <Label>詳細地址 <span className="text-muted-foreground font-normal">（選填）</span></Label>
              <Input
                name="address"
                defaultValue={address ?? ""}
                placeholder="例：G/F, 88 Nathan Road, Mong Kok"
              />
            </div>

            {/* External links */}
            <div className="space-y-1">
              <Label>Google Maps URL <span className="text-muted-foreground font-normal">（選填）</span></Label>
              <Input
                name="googleMapsUrl"
                defaultValue={googleMapsUrl ?? ""}
                placeholder="https://maps.google.com/..."
                inputMode="url"
              />
            </div>

            <div className="space-y-1">
              <Label>OpenRice URL <span className="text-muted-foreground font-normal">（選填）</span></Label>
              <Input
                name="openRiceUrl"
                defaultValue={openRiceUrl ?? ""}
                placeholder="https://www.openrice.com/..."
                inputMode="url"
              />
            </div>

            <div className="space-y-1">
              <Label>📍 Amap 高德地圖 URL <span className="text-muted-foreground font-normal">（選填）</span></Label>
              <Input
                name="gaodeMapsUrl"
                defaultValue={gaodeMapsUrl ?? ""}
                placeholder="https://amap.com/..."
                inputMode="url"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1 h-11">取消</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} className="flex-1 h-11">
                {isPending ? "儲存中…" : "儲存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
