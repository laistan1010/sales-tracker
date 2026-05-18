"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { ActivityType, LeadStatus, TaskType } from "@/generated/prisma/enums";
import { TASK_TYPE_META } from "@/lib/constants";
import { STATUS_LABELS } from "@/lib/constants";

type ActionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  success?: boolean;
};

// ── Quick Log ────────────────────────────────────────────────────────────
export async function createActivity(leadId: string, type: ActivityType, notes: string) {
  if (!notes.trim()) return { error: "請填寫備忘錄" };
  await prisma.activity.create({ data: { leadId, type, notes: notes.trim() } });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/activities");
}

// ── Add Contact ──────────────────────────────────────────────────────────
export async function createContact(
  leadId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name  = (formData.get("name")  as string | null)?.trim() ?? "";
  const title = (formData.get("title") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;

  if (!name) return { fieldErrors: { name: "姓名為必填" } };

  await prisma.contact.create({ data: { leadId, name, title, phone } });
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

// ── Update Lead Review ───────────────────────────────────────────────────
export async function updateLeadReview(
  leadId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const reviewRating = (formData.get("reviewRating") as string | null)?.trim() || null;
  const gaodeRating  = (formData.get("gaodeRating")  as string | null)?.trim() || null;
  const reviewIssues = (formData.get("reviewIssues") as string | null)?.trim() || null;
  const reviewNotes  = (formData.get("reviewNotes")  as string | null)?.trim() || null;

  await prisma.lead.update({
    where: { id: leadId },
    data: { reviewRating, gaodeRating, reviewIssues, reviewNotes },
  });

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

// ── Update Lead Pipeline Status ──────────────────────────────────────────
export async function updateLeadStatus(
  leadId: string,
  prevStatus: LeadStatus,
  newStatus: LeadStatus,
  objectionNotes?: string
): Promise<ActionState> {
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: newStatus,
      ...(objectionNotes !== undefined && { objectionNotes: objectionNotes.trim() || null }),
    },
  });

  const fromLabel = STATUS_LABELS[prevStatus].zh;
  const toLabel   = STATUS_LABELS[newStatus].zh;
  await prisma.activity.create({
    data: {
      leadId,
      type: "PIPELINE",
      notes: "Pipeline 更新：" + fromLabel + " → " + toLabel,
    },
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { success: true };
}

// ── Tasks ────────────────────────────────────────────────────────────────
export async function createTask(
  leadId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const type  = ((formData.get("type")  as string | null) || "MEETING") as TaskType;
  const date  = (formData.get("date")  as string | null)?.trim() || null;
  const time  = (formData.get("time")  as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  if (!date) return { error: "請選擇日期" };

  await prisma.task.create({
    data: { leadId, type, date, time: time || null, notes: notes || null },
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteTask(leadId: string, taskId: string): Promise<ActionState> {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function completeTask(leadId: string, taskId: string): Promise<ActionState> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "任務不存在" };

  const meta = TASK_TYPE_META[task.type];

  await prisma.$transaction([
    prisma.activity.create({
      data: {
        leadId,
        type: meta.activityType as ActivityType,
        notes: task.notes || `已完成${meta.zh}`,
      },
    }),
    prisma.task.delete({ where: { id: taskId } }),
  ]);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
  return { success: true };
}

// ── Delete Contact ───────────────────────────────────────────────────────
export async function deleteContact(
  leadId: string,
  contactId: string
): Promise<ActionState> {
  await prisma.contact.delete({ where: { id: contactId } });
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

// ── Update Lead basic info ───────────────────────────────────────────────
export async function updateLead(
  leadId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const storeName     = (formData.get("storeName")     as string | null)?.trim() || undefined;
  const district      = (formData.get("district")      as string | null)?.trim() || undefined;
  const address       = (formData.get("address")       as string | null)?.trim() || null;
  const googleMapsUrl = (formData.get("googleMapsUrl") as string | null)?.trim() || null;
  const openRiceUrl   = (formData.get("openRiceUrl")   as string | null)?.trim() || null;
  const gaodeMapsUrl  = (formData.get("gaodeMapsUrl")  as string | null)?.trim() || null;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(storeName && { storeName }),
      ...(district  && { district }),
      address,
      googleMapsUrl,
      openRiceUrl,
      gaodeMapsUrl,
    },
  });

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}
