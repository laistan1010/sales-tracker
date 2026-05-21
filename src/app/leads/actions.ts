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

export async function deleteLead(leadId: string): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "只有管理員可以刪除商戶" };

  await prisma.lead.delete({ where: { id: leadId } });
  revalidatePath("/leads");
  revalidatePath("/");
  return { success: true };
}

// ── 批量指派 ──────────────────────────────────────────────────────────────────
export async function assignLeads(
  leadIds: string[],
  assignedToId: string
): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "只有管理員可以指派商戶" };
  if (!leadIds.length || !assignedToId) return { error: "請選擇商戶及負責人" };

  await prisma.lead.updateMany({
    where: { id: { in: leadIds } },
    data: { assignedToId },
  });

  revalidatePath("/leads");
  revalidatePath("/");
  return { success: true };
}

// ── 批量匯入 ──────────────────────────────────────────────────────────────────
export type BulkLeadRow = {
  storeName: string;
  industry: string;
  district: string;
  address?: string;
  googleMapsUrl?: string;
  gaodeMapsUrl?: string;
  openRiceUrl?: string;
  picName?: string;
};

export async function bulkCreateLeads(
  rows: BulkLeadRow[]
): Promise<{ error?: string; created: number; updated: number; skipped: number }> {
  const session = await auth();
  if (!session?.user?.id)
    return { error: "未登入，請重新登入", created: 0, updated: 0, skipped: 0 };

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const storeName   = row.storeName?.trim();
    const district    = row.district?.trim();
    const industry    = row.industry?.trim();

    if (!storeName || !district || !(ALL_INDUSTRIES as string[]).includes(industry)) {
      skipped++;
      continue;
    }

    try {
      // If a lead with the same storeName already exists, update its URLs/address.
      // Otherwise create a new lead.
      const existing = await prisma.lead.findFirst({ where: { storeName } });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            district,
            industry:      industry as Industry,
            address:       row.address?.trim()       || existing.address       || undefined,
            googleMapsUrl: row.googleMapsUrl?.trim() || existing.googleMapsUrl || undefined,
            gaodeMapsUrl:  row.gaodeMapsUrl?.trim()  || existing.gaodeMapsUrl  || undefined,
            openRiceUrl:   row.openRiceUrl?.trim()   || existing.openRiceUrl   || undefined,
          },
        });
        // Add contact only if none exists yet and a name was provided
        if (row.picName?.trim()) {
          const hasContact = await prisma.contact.findFirst({ where: { leadId: existing.id } });
          if (!hasContact) {
            await prisma.contact.create({
              data: { name: row.picName.trim(), leadId: existing.id },
            });
          }
        }
        updated++;
      } else {
        const lead = await prisma.lead.create({
          data: {
            storeName,
            industry:      industry as Industry,
            district,
            address:       row.address?.trim()       || undefined,
            googleMapsUrl: row.googleMapsUrl?.trim() || undefined,
            gaodeMapsUrl:  row.gaodeMapsUrl?.trim()  || undefined,
            openRiceUrl:   row.openRiceUrl?.trim()   || undefined,
            assignedToId:  session.user.id,
          },
        });
        if (row.picName?.trim()) {
          await prisma.contact.create({
            data: { name: row.picName.trim(), leadId: lead.id },
          });
        }
        created++;
      }
    } catch {
      skipped++;
    }
  }

  revalidatePath("/leads");
  return { created, updated, skipped };
}
