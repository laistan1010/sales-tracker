"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Industry } from "@/generated/prisma/enums";
import { ALL_INDUSTRIES } from "@/lib/constants";

export type ActionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  success?: boolean;
};

// ── 極速建檔：店名 + 行業 + 區份/地鐵站 ─────────────────────────────────
export async function createLead(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "未登入，請重新登入" };

  const storeName = (formData.get("storeName") as string | null)?.trim() ?? "";
  const industry  = (formData.get("industry")  as string | null)?.trim() ?? "";
  const district  = (formData.get("district")  as string | null)?.trim() ?? "";

  const fieldErrors: Record<string, string> = {};
  if (!storeName) fieldErrors.storeName = "店名為必填";
  if (!(ALL_INDUSTRIES as string[]).includes(industry))
    fieldErrors.industry = "請選擇行業";
  if (!district)  fieldErrors.district  = "區份/地鐵站為必填";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  await prisma.lead.create({
    data: {
      storeName,
      industry:    industry as Industry,
      district,
      assignedToId: session.user.id,  // 防搶客：強制綁定登入者
    },
  });

  revalidatePath("/leads");
  return { success: true };
}
