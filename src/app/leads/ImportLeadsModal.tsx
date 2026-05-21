"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { bulkCreateLeads, type BulkLeadRow } from "./actions";
import { INDUSTRY_LABELS } from "@/lib/constants";

// ── Column auto-detection ────────────────────────────────────────────────────

const FIELD_ALIASES: Record<string, string[]> = {
  storeName:     ["店名", "餐廳名稱", "名稱", "store name", "store", "name", "restaurant"],
  district:      ["地區", "區份", "地鐵站", "district", "area"],
  industry:      ["行業", "industry"],
  picName:       ["負責人", "pic", "contact", "聯絡人", "person"],
  address:       ["地址", "address"],
  googleMapsUrl: ["google maps", "google map", "google", "maps"],
  gaodeMapsUrl:  ["amap", "高德", "gaode"],
  openRiceUrl:   ["openrice", "open rice", "開飯"],
};

// Maps display labels → enum values (case-insensitive key lookup)
const INDUSTRY_VALUE_MAP: Record<string, string> = {
  "飲食": "F_AND_B", "f&b": "F_AND_B", "fnb": "F_AND_B", "餐飲": "F_AND_B",
  "醫美": "MEDICAL_BEAUTY", "醫學美容": "MEDICAL_BEAUTY", "medical beauty": "MEDICAL_BEAUTY",
  "美容": "BEAUTY", "beauty": "BEAUTY",
  "足療": "FOOT", "foot": "FOOT", "足浴": "FOOT",
  "其他": "OTHER", "other": "OTHER",
  // Accept enum values directly
  "f_and_b": "F_AND_B", "medical_beauty": "MEDICAL_BEAUTY",
};

const VALID_INDUSTRIES = new Set(["F_AND_B", "MEDICAL_BEAUTY", "BEAUTY", "FOOT", "OTHER"]);

// ── Types ────────────────────────────────────────────────────────────────────

type ParsedRow = BulkLeadRow & {
  _industryLabel: string;
  _valid: boolean;
  _errors: string[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function detectCol(headers: string[], aliases: string[]): string | undefined {
  return headers.find(h =>
    aliases.some(a => h.toLowerCase().includes(a.toLowerCase()))
  );
}

function mapIndustry(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "OTHER";
  const key = Object.keys(INDUSTRY_VALUE_MAP).find(
    k => k.toLowerCase() === trimmed.toLowerCase()
  );
  return key ? INDUSTRY_VALUE_MAP[key] : "OTHER";
}

async function parseFile(
  file: File
): Promise<{ rows: ParsedRow[]; missingCols: string[] }> {
  const { read, utils } = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: Record<string, unknown>[] = utils.sheet_to_json(ws, { defval: "" });

  if (!raw.length) return { rows: [], missingCols: [] };

  const headers = Object.keys(raw[0]);
  const colMap: Record<string, string | undefined> = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    colMap[field] = detectCol(headers, aliases);
  }

  const missingCols: string[] = [];
  if (!colMap.storeName) missingCols.push("店名 / 餐廳名稱");
  if (!colMap.district)  missingCols.push("地區");
  if (!colMap.industry)  missingCols.push("行業");

  function cell(row: Record<string, unknown>, field: string): string {
    const col = colMap[field];
    return col ? String(row[col] ?? "").trim() : "";
  }

  const rows: ParsedRow[] = raw.map(r => {
    const storeName   = cell(r, "storeName");
    const industryRaw = cell(r, "industry");
    const industry    = mapIndustry(industryRaw);
    const district    = cell(r, "district");

    const errors: string[] = [];
    if (!storeName) errors.push("缺少店名");
    if (!district)  errors.push("缺少地區");

    const industryLabel = VALID_INDUSTRIES.has(industry)
      ? INDUSTRY_LABELS[industry as keyof typeof INDUSTRY_LABELS].zh
      : industryRaw;

    return {
      storeName,
      industry,
      district,
      address:      cell(r, "address"),
      googleMapsUrl: cell(r, "googleMapsUrl"),
      gaodeMapsUrl:  cell(r, "gaodeMapsUrl"),
      openRiceUrl:   cell(r, "openRiceUrl"),
      picName:       cell(r, "picName"),
      _industryLabel: industryLabel,
      _valid:  errors.length === 0,
      _errors: errors,
    };
  });

  return { rows, missingCols };
}

// ── Component ────────────────────────────────────────────────────────────────

export function ImportLeadsModal() {
  const [open, setOpen]               = useState(false);
  const [rows, setRows]               = useState<ParsedRow[]>([]);
  const [missingCols, setMissingCols] = useState<string[]>([]);
  const [parseError, setParseError]   = useState<string | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult]           = useState<{ created: number; updated: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setParseError(null);
    setResult(null);
    setRows([]);
    setMissingCols([]);
    try {
      const parsed = await parseFile(file);
      setRows(parsed.rows);
      setMissingCols(parsed.missingCols);
    } catch {
      setParseError("解析失敗，請確保檔案格式正確（.xlsx / .xls / .csv）");
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  async function handleImport() {
    const validRows = rows.filter(r => r._valid);
    if (!validRows.length) return;
    setIsImporting(true);
    const toSend: BulkLeadRow[] = validRows.map(r => ({
      storeName:     r.storeName,
      industry:      r.industry,
      district:      r.district,
      address:       r.address      || undefined,
      googleMapsUrl: r.googleMapsUrl || undefined,
      gaodeMapsUrl:  r.gaodeMapsUrl  || undefined,
      openRiceUrl:   r.openRiceUrl   || undefined,
      picName:       r.picName       || undefined,
    }));
    const res = await bulkCreateLeads(toSend);
    setIsImporting(false);
    if (res.error) {
      setParseError(res.error);
    } else {
      setResult(res);
      setRows([]);
    }
  }

  function resetFile() {
    setRows([]);
    setMissingCols([]);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    setOpen(false);
    resetFile();
    setResult(null);
  }

  const validCount   = rows.filter(r => r._valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 shrink-0"
      >
        <Upload className="h-4 w-4" />
        批量匯入
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              批量匯入商戶
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">

            {/* Instructions */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground mb-1.5">Excel / CSV 欄位對照（欄標題包含以下關鍵字即可自動識別）：</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                <span>• <strong>店名 / 餐廳名稱</strong>（必填）</span>
                <span>• <strong>地區</strong>（必填）</span>
                <span>• <strong>行業</strong>（必填）：飲食 / 醫美 / 美容 / 足療</span>
                <span>• <strong>負責人 / PIC</strong>（選填）</span>
                <span>• <strong>地址</strong>（選填）</span>
                <span>• <strong>Google Maps</strong>（選填）</span>
                <span>• <strong>高德 / Amap</strong>（選填）</span>
                <span>• <strong>OpenRice</strong>（選填）</span>
              </div>
            </div>

            {/* Upload dropzone */}
            {rows.length === 0 && !result && (
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors select-none ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">拖放或點擊上傳檔案</p>
                <p className="text-xs text-muted-foreground mt-1">支援 .xlsx · .xls · .csv</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>
            )}

            {/* Parse error */}
            {parseError && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {parseError}
              </div>
            )}

            {/* Missing required columns */}
            {missingCols.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">找不到以下必填欄位：{missingCols.join("、")}</p>
                  <p className="text-xs mt-0.5">請確認欄位標題與上方關鍵字相符。</p>
                </div>
              </div>
            )}

            {/* Preview table */}
            {rows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">共 {rows.length} 行</span>
                  <span className="text-green-600 font-medium">✓ 有效：{validCount}</span>
                  {invalidCount > 0 && (
                    <span className="text-red-500 font-medium">✗ 跳過：{invalidCount}</span>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-auto max-h-72">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/60 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8">#</th>
                          <th className="px-2 py-2 w-5" />
                          <th className="px-3 py-2 text-left font-medium">店名</th>
                          <th className="px-3 py-2 text-left font-medium">地區</th>
                          <th className="px-3 py-2 text-left font-medium">行業</th>
                          <th className="px-3 py-2 text-left font-medium">負責人</th>
                          <th className="px-3 py-2 text-left font-medium text-red-500">問題</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr
                            key={i}
                            className={`border-t ${
                              row._valid ? "hover:bg-muted/20" : "bg-red-50/60"
                            }`}
                          >
                            <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                            <td className="px-2 py-1.5">
                              {row._valid
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                : <XCircle className="h-3.5 w-3.5 text-red-400" />
                              }
                            </td>
                            <td className="px-3 py-1.5 font-medium max-w-[180px] truncate">
                              {row.storeName || <span className="text-muted-foreground italic">（空）</span>}
                            </td>
                            <td className="px-3 py-1.5 max-w-[100px] truncate">
                              {row.district || <span className="text-muted-foreground italic">（空）</span>}
                            </td>
                            <td className="px-3 py-1.5">
                              {row._industryLabel || <span className="text-muted-foreground italic">（空）</span>}
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground max-w-[100px] truncate">
                              {row.picName || "—"}
                            </td>
                            <td className="px-3 py-1.5 text-red-500 max-w-[160px]">
                              {row._errors.length ? row._errors.join("、") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  地址、Google Maps、高德地圖、OpenRice 欄位（若有）亦會一併匯入。無效行將被略過。
                </p>
              </div>
            )}

            {/* Success */}
            {result && (
              <div className="flex flex-col items-center gap-3 py-8">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <div className="text-center">
                  <p className="font-semibold text-lg">匯入完成！</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.created > 0 && (
                      <>新增 <span className="font-bold text-green-600">{result.created}</span> 個商戶　</>
                    )}
                    {result.updated > 0 && (
                      <>更新 <span className="font-bold text-blue-600">{result.updated}</span> 個商戶　</>
                    )}
                    {result.skipped > 0 && (
                      <>跳過 <span className="font-bold text-red-500">{result.skipped}</span> 行</>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-2 pt-3 border-t shrink-0">
            {rows.length > 0 && !result && (
              <>
                <Button
                  variant="outline"
                  onClick={resetFile}
                  className="flex-1 h-12"
                >
                  重新上傳
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting || validCount === 0}
                  className="flex-1 h-12 font-bold bg-green-600 hover:bg-green-500 active:bg-green-700 text-white"
                >
                  {isImporting ? "匯入中…" : `確認匯入 ${validCount} 個商戶`}
                </Button>
              </>
            )}
            {(rows.length === 0 || result) && (
              <DialogClose asChild>
                <Button
                  onClick={handleClose}
                  className="w-full h-12 font-bold bg-red-600 hover:bg-red-500 active:bg-red-700 text-white"
                >
                  {result ? "完成" : "取消"}
                </Button>
              </DialogClose>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
