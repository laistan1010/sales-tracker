import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { INDUSTRY_LABELS, STATUS_LABELS, ACTIVITY_LABELS } from "@/lib/constants";
import { QuickLog } from "./QuickLog";
import { ContactSection } from "./ContactSection";
import { EditLeadModal } from "./EditLeadModal";
import { ReviewSection } from "./ReviewSection";
import { PipelineTracker } from "./PipelineTracker";
import { cn } from "@/lib/utils";
import { ArrowLeft, MapPin, ExternalLink } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      contacts:   { orderBy: { name: "asc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  const industryMeta = INDUSTRY_LABELS[lead.industry];
  const statusMeta   = STATUS_LABELS[lead.status];

  return (
    <div className="space-y-5 pb-10">
      {/* Back */}
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回商戶列表
      </Link>

      {/* ── Pipeline Tracker ────────────────────────────────────────── */}
      <PipelineTracker
        leadId={lead.id}
        currentStatus={lead.status}
        objectionNotes={lead.objectionNotes ?? null}
      />

      {/* ── Header card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold leading-tight">{lead.storeName}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <EditLeadModal
              leadId={lead.id}
              storeName={lead.storeName}
              district={lead.district}
              address={lead.address}
              googleMapsUrl={lead.googleMapsUrl}
              openRiceUrl={lead.openRiceUrl}
              gaodeMapsUrl={lead.gaodeMapsUrl}
            />
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                statusMeta.color
              )}
            >
              {statusMeta.zh}
            </span>
          </div>
        </div>

        {/* District pill — always visible, key spatial info */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1 text-sm font-semibold text-background">
            📍 {lead.district}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
              industryMeta.color
            )}
          >
            {industryMeta.zh}
          </span>
        </div>

        {/* Detailed address — optional, shown when set */}
        {lead.address ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{lead.address}</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            詳細地址未填寫 — 點擊「編輯資料」補填
          </p>
        )}

        {/* External links */}
        {(lead.googleMapsUrl || lead.openRiceUrl || lead.gaodeMapsUrl) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {lead.googleMapsUrl && (
              <a
                href={lead.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                <span>🗺️</span> Google Maps
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            )}
            {lead.openRiceUrl && (
              <a
                href={lead.openRiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                <span>🍽️</span> OpenRice
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            )}
            {lead.gaodeMapsUrl && (
              <a
                href={lead.gaodeMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                <span>📍</span> Amap 高德
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            )}
          </div>
        )}

        {lead.assignedTo && (
          <p className="text-xs text-muted-foreground">
            負責同事：<span className="font-medium text-foreground">{lead.assignedTo.name}</span>
          </p>
        )}
      </div>

      {/* ── Contacts ────────────────────────────────────────────────── */}
      <ContactSection leadId={lead.id} contacts={lead.contacts} />

      {/* ── Quick Log ───────────────────────────────────────────────── */}
      <QuickLog leadId={lead.id} />

      {/* ── Digital Review ──────────────────────────────────────────── */}
      <ReviewSection
        leadId={lead.id}
        storeName={lead.storeName}
        initialRating={lead.reviewRating}
        initialGaodeRating={lead.gaodeRating}
        initialIssues={lead.reviewIssues}
        initialNotes={lead.reviewNotes}
      />

      {/* ── Activity history ────────────────────────────────────────── */}
      {lead.activities.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">跟進記錄</h2>
          <ol className="relative space-y-4 border-l-2 border-border pl-5">
            {lead.activities.map((act) => {
              const meta = ACTIVITY_LABELS[act.type];
              return (
                <li key={act.id} className="relative">
                  <span className="absolute -left-[1.625rem] flex h-6 w-6 items-center justify-center rounded-full border bg-background text-sm">
                    {meta.icon}
                  </span>
                  <div className="rounded-xl border bg-card p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{meta.zh}</span>
                      <time className="text-xs text-muted-foreground">
                        {new Date(act.createdAt).toLocaleDateString("zh-HK", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{act.notes}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
