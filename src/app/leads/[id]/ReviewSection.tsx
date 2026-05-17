"use client";

import { useEffect, useActionState, useState } from "react";
import { AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateLeadReview } from "./actions";

const ISSUES = [
  {
    code: "missing_info",
    label: "資訊不全",
    desc: "沒寫營業時間 / 缺少電話",
  },
  {
    code: "negative_reviews",
    label: "1-2 星負面評價",
    desc: "存在 3 個月以上未回覆的嚴重負評",
  },
  {
    code: "lacking_reviews",
    label: "缺乏近期評價",
    desc: "近數個月沒有任何新評論，導致網絡搜尋排名下滑",
  },
  {
    code: "missing_menu",
    label: "缺少清晰線上餐牌",
    desc: "網上找不到餐牌或圖片模糊，導致潛在食客流失",
  },
  {
    code: "no_social_media",
    label: "網上缺乏社群平台",
    desc: "完全沒有開設 Facebook / Instagram，或已超過半年沒有更新，徹底錯失網上與年輕客源",
  },
] as const;

const ISSUE_LABELS: Record<string, string> = {
  missing_info:     "資訊不全（無營業時間 / 電話）",
  negative_reviews: "1-2 星負面評價（3 個月以上未回覆嚴重負評）",
  lacking_reviews:  "缺乏近期評價（搜尋排名持續下滑）",
  missing_menu:     "缺少清晰線上餐牌（潛在食客流失）",
  no_social_media:  "網上缺乏社群平台（錯失年輕客源）",
};

interface Props {
  leadId:        string;
  storeName:     string;
  initialRating: string | null;
  initialIssues: string | null;
  initialNotes:  string | null;
}

export function ReviewSection({
  leadId,
  storeName,
  initialRating,
  initialIssues,
  initialNotes,
}: Props) {
  const [rating,         setRating]         = useState(initialRating ?? "");
  const [selectedIssues, setSelectedIssues] = useState<string[]>(
    initialIssues ? initialIssues.split(",").filter(Boolean) : []
  );
  const [notes,      setNotes]      = useState(initialNotes ?? "");
  const [showReport, setShowReport] = useState(!!(initialRating || initialIssues));

  const boundAction = updateLeadReview.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if ((state as { success?: boolean }).success) setShowReport(true);
  }, [state]);

  function toggleIssue(code: string) {
    setSelectedIssues(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }

  function handleWhatsApp() {
    // ── Emoji: Unicode escape sequences prevent 4-byte chars from being
    //   mangled by file encoding or transpiler surrogate-pair handling ──
    const WARN  = "\u{26A0}\u{FE0F}"; // ⚠️
    const CHART = "\u{1F4CA}";        // 📊
    const CHECK = "\u{2705}";         // ✅
    const FEAR  = "\u{1F628}";        // 😨
    const FLEX  = "\u{1F4AA}";        // 💪
    const SMILE = "\u{1F60A}";        // 😊

    // ── Cantonese colloquial characters: also escaped to survive any
    //   UTF-8 → UTF-16 mishandling in the build pipeline ──
    const GEI = "嘅"; // U+5605 ge3 (possessive particle)
    const ZO  = "咗"; // U+5497 zo3 (perfective aspect)

    const GU  = "顧"; // U+9867 gu3 (as in consultant)

    const ratingLine = rating
      ? CHART + " Google Maps 評分：" + rating + " / 5.0 分（行業平均 4.3 分）"
      : "";
    const issueLines = selectedIssues
      .map(c => WARN + " " + ISSUE_LABELS[c])
      .join("\n");

    const lines: string[] = [
      "老細／經理你好！我係剛才拜訪" + GEI + "數碼" + GU + "問 " + SMILE,
      "",
      "剛剛為「" + storeName + "」做" + ZO + "數碼營銷健康審查，發現以下數碼營銷漏洞：",
      "",
    ];
    if (ratingLine) lines.push(ratingLine);
    if (issueLines) lines.push(issueLines);
    lines.push(
      "",
      "根據大數據分析，未經優化的商戶檔案預計將導致高達 15% 至 20% 顧客流失。" + FEAR,
      "",
      CHECK + " 好消息：我們有即時解決方案，可以幫你提升業績！",
      "歡迎覆機傾一傾，今日行動、免費評估！" + FLEX
    );

    const message = lines.join("\n");
    window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank");
  }

  const ratingNum   = parseFloat(rating);
  const ratingValid = rating !== "" && !isNaN(ratingNum);
  const ratingTier  =
    ratingNum >= 4.2 ? "good" : ratingNum >= 3.7 ? "warn" : "danger";
  const tierLabel   = ratingTier === "good"
    ? "✅ 表現優異"
    : ratingTier === "warn"
    ? "⚠️ 表現平穩，具備優化潛力"
    : "🔴 急需改善";
  const tierChipCls = {
    good:   "bg-green-50  border-green-300  text-green-700  dark:bg-green-950/60  dark:border-green-700  dark:text-green-400",
    warn:   "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-950/60 dark:border-yellow-700 dark:text-yellow-400",
    danger: "bg-red-50    border-red-300    text-red-700    dark:bg-red-950/60    dark:border-red-700    dark:text-red-400",
  }[ratingTier];
  const bigNumCls = {
    good:   "text-green-400",
    warn:   "text-yellow-400",
    danger: "text-red-400",
  }[ratingTier];

  const hasData = ratingValid || selectedIssues.length > 0;

  // ── Display strings (rendered by browser, encoding-safe in JSX) ─────
  const S = {
    sectionTitle:  "🔥 數碼營銷健康審查報告",
    labelRating:   "Google Maps 評分（5.0 為滿分）",
    labelIssues:   "發現的數碼營銷漏洞",
    labelNotes:    "附加備註",
    labelOptional: "（選填）",
    notesPlaceholder: "例：競爭對手評分 4.6，差距明顯…",
    btnSaving:   "儲存中…",
    btnSave:     "儲存並產生報告",
    ratingSlash: "/ 5.0",
    reportBadge: "數碼營銷健康審查報告",
    reportShop:  "商戸名稱",
    reportGMaps: "Google Maps 評分",
    issueCount:  (n: number) => "發現 " + n + " 個數碼營銷漏洞",
    warning:     "根據大數據分析，未經優化的商戶檔案預計將導致高達",
    warningPct:  "15% – 20%",
    warningEnd:  "顧客流失。",
    solTitle:    "我們的解決方案",
    solBody:     "專業數碼營銷提升服務 — 優化 Google Maps 評分管理、統一網上資訊、建立社群平台、打造吸引餐牌相片，全面堪塞以上漏洞。",
    waBtn:       "💬 一鍵分享報告至 WhatsApp",
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">{S.sectionTitle}</h2>

      {/* ── Input form ──────────────────────────────────────────── */}
      <form action={formAction} className="rounded-2xl border bg-card p-4 space-y-4">
        <input type="hidden" name="reviewIssues" value={selectedIssues.join(",")} />

        {/* Google Maps rating */}
        <div className="space-y-1.5">
          <Label>{S.labelRating}</Label>
          <div className="flex items-center gap-2">
            <Input
              name="reviewRating"
              value={rating}
              onChange={e => setRating(e.target.value)}
              placeholder="3.5"
              className="max-w-[110px]"
              inputMode="decimal"
            />
            <span className="text-sm text-muted-foreground">{S.ratingSlash}</span>
            {ratingValid && (
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", tierChipCls)}>
                {tierLabel}
              </span>
            )}
          </div>
        </div>

        {/* 5 checkboxes */}
        <div className="space-y-2">
          <Label>{S.labelIssues}</Label>
          {ISSUES.map(({ code, label, desc }) => {
            const checked = selectedIssues.includes(code);
            return (
              <label
                key={code}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                  checked
                    ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                    : "border-border hover:border-red-300 hover:bg-red-50/40 dark:hover:bg-red-950/10"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleIssue(code)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-red-500"
                />
                <div>
                  <p className="text-sm font-medium leading-none">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label>
            {S.labelNotes}{" "}
            <span className="text-muted-foreground font-normal">{S.labelOptional}</span>
          </Label>
          <Input
            name="reviewNotes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={S.notesPlaceholder}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full gap-2">
          <Zap className="h-4 w-4" />
          {isPending ? S.btnSaving : S.btnSave}
        </Button>
      </form>

      {/* ── Report card ─────────────────────────────────────────── */}
      {showReport && hasData && (
        <div className="rounded-2xl overflow-hidden border-2 border-red-700 shadow-xl shadow-red-950/40">

          {/* Header */}
          <div className="bg-gradient-to-br from-red-950 via-zinc-900 to-zinc-950 px-5 py-5">
            <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-widest mb-3">
              <AlertTriangle className="h-3.5 w-3.5" />
              {S.reportBadge}
            </div>
            <p className="text-zinc-500 text-xs mb-0.5">{S.reportShop}</p>
            <h3 className="text-white text-xl font-black">{storeName}</h3>

            {ratingValid && (
              <div className="mt-3 space-y-1">
                <p className="text-zinc-500 text-xs">{S.reportGMaps}</p>
                <div className="flex items-end gap-2">
                  <span className={cn("text-5xl font-black tabular-nums leading-none", bigNumCls)}>
                    {rating}
                  </span>
                  <span className="text-zinc-500 text-sm mb-1">/ 5.0</span>
                  <span className={cn(
                    "mb-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
                    ratingTier === "good"   ? "bg-green-700  text-green-200"  :
                    ratingTier === "warn"   ? "bg-yellow-700 text-yellow-200" :
                                             "bg-red-700    text-red-200"
                  )}>
                    {tierLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Issues */}
          {selectedIssues.length > 0 && (
            <div className="bg-zinc-950 px-5 py-4 space-y-3">
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">
                {S.issueCount(selectedIssues.length)}
              </p>
              {selectedIssues.map(code => (
                <div key={code} className="flex items-start gap-2.5">
                  <span className="text-red-600 font-black text-base leading-none mt-0.5">&#10005;</span>
                  <p className="text-zinc-200 text-sm font-medium leading-snug">
                    {ISSUE_LABELS[code]}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Warning banner */}
          <div className="bg-gradient-to-r from-red-900/90 to-red-950/90 border-t border-red-800 px-5 py-4">
            <p className="text-red-200 text-sm font-bold leading-relaxed">
              {S.warning}{" "}
              <span className="text-white text-base">{S.warningPct}</span>{" "}
              {S.warningEnd}
            </p>
          </div>

          {/* Solution */}
          <div className="bg-zinc-900 border-t border-zinc-800 px-5 py-4 space-y-2">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 text-sm font-bold">{S.solTitle}</p>
                <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{S.solBody}</p>
              </div>
            </div>
            {notes && (
              <div className="ml-8 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2">
                <p className="text-zinc-300 text-xs leading-relaxed">{notes}</p>
              </div>
            )}
          </div>

          {/* WhatsApp CTA */}
          <div className="bg-zinc-950 border-t border-zinc-800 px-4 py-4">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-base py-3.5 transition-colors"
            >
              {S.waBtn}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
