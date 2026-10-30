"use client";
import React, { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  WifiOff,
  Database,
  Info,
} from "lucide-react";
import { Modal, Badge, btnCls, btnSecondary, useToast } from "@/components/ui";
import {
  detectAndParseFile,
  exportToExcelOrCsv,
  downloadSampleTemplate,
  SupportedFormat,
  PATIENT_COLUMNS,
  TREATMENT_COLUMNS,
  INJECTION_COLUMNS,
  USER_COLUMNS,
  ColumnDefinition,
} from "@/lib/fileProcessor";
import {
  enqueueOfflineUpload,
  useOnlineStatus,
  OfflineEntityType,
} from "@/lib/offlineQueue";
import {
  bulkCreatePatientsInDb,
  bulkCreateTreatmentsInDb,
  bulkCreateInjectionsInDb,
  bulkCreateUsersInDb,
  recordImportHistory,
  recordExportHistory,
} from "@/lib/dataService";

// ─── Bulk Upload Modal ────────────────────────────────────────────────────────
export interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: OfflineEntityType;
  title: string;
  isLiveDb: boolean;
  onSuccess: (importedRows: any[]) => void;
}

export function BulkUploadModal({
  isOpen,
  onClose,
  entityType,
  title,
  isLiveDb,
  onSuccess,
}: BulkUploadModalProps) {
  const { addToast } = useToast();
  const isOnline = useOnlineStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<SupportedFormat | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const getColumns = (): ColumnDefinition[] => {
    switch (entityType) {
      case "patients":
        return PATIENT_COLUMNS;
      case "treatments":
        return TREATMENT_COLUMNS;
      case "injections":
        return INJECTION_COLUMNS;
      case "users":
        return USER_COLUMNS;
    }
  };

  const columns = getColumns();

  const handleReset = () => {
    setSelectedFile(null);
    setDetectedFormat(null);
    setParsedRows([]);
    setDetectedHeaders([]);
    setErrorMsg("");
  };

  const handleFileProcess = async (file: File) => {
    setErrorMsg("");
    setIsParsing(true);
    setSelectedFile(file);

    try {
      const result = await detectAndParseFile(file);
      setDetectedFormat(result.format);
      setDetectedHeaders(result.headers);

      if (result.rows.length === 0) {
        setErrorMsg("The selected file contains no readable data rows.");
        setParsedRows([]);
      } else {
        setParsedRows(result.rows);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse file.");
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedFile || parsedRows.length === 0) return;
    setIsCommitting(true);
    setErrorMsg("");

    const format = detectedFormat || "csv";

    // Scenario 1: Offline or Network Disconnected
    if (!isOnline) {
      enqueueOfflineUpload(entityType, selectedFile.name, format, parsedRows);
      setIsCommitting(false);
      addToast(
        "warning",
        "Network Disconnected — Saved Offline",
        `${parsedRows.length} records saved to your Offline Sync Queue. They will automatically upload when network returns.`
      );
      onSuccess(parsedRows);
      onClose();
      handleReset();
      return;
    }

    // Scenario 2: Online Upload to Database
    try {
      let dbResult: { success: boolean; count?: number; data?: any[]; error?: string } = {
        success: false,
      };

      if (entityType === "patients") {
        dbResult = await bulkCreatePatientsInDb(parsedRows, isLiveDb);
      } else if (entityType === "treatments") {
        dbResult = await bulkCreateTreatmentsInDb(parsedRows, isLiveDb);
      } else if (entityType === "injections") {
        dbResult = await bulkCreateInjectionsInDb(parsedRows, isLiveDb);
      } else if (entityType === "users") {
        dbResult = await bulkCreateUsersInDb(parsedRows, isLiveDb);
      }

      if (dbResult.success) {
        // Record in import history
        await recordImportHistory({
          id: `imp-${Date.now().toString().slice(-6)}`,
          filename: selectedFile.name,
          format,
          records_count: parsedRows.length,
          success_count: dbResult.count || parsedRows.length,
          failed_count: 0,
          status: "Completed",
          operator: "Clinical Operator",
        });

        addToast(
          "success",
          "Bulk Upload Completed",
          `Successfully imported ${dbResult.count || parsedRows.length} ${entityType} records into database.`
        );

        onSuccess(dbResult.data || parsedRows);
        onClose();
        handleReset();
      } else {
        // If DB failed due to connection, offer offline save
        enqueueOfflineUpload(entityType, selectedFile.name, format, parsedRows);
        addToast(
          "warning",
          "Stored to Offline Queue",
          `Database connection paused (${dbResult.error || "Network error"}). Records saved to offline queue.`
        );
        onSuccess(parsedRows);
        onClose();
        handleReset();
      }
    } catch (err: any) {
      // Fallback to offline save
      enqueueOfflineUpload(entityType, selectedFile.name, format, parsedRows);
      addToast(
        "info",
        "Saved in Offline Queue",
        "Records saved locally and queued for upload when connection stabilizes."
      );
      onSuccess(parsedRows);
      onClose();
      handleReset();
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 text-xs">
        {/* Offline indicator notice */}
        {!isOnline && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl neu-inset text-amber-700 dark:text-amber-300">
            <WifiOff size={16} className="flex-shrink-0" />
            <div>
              <span className="font-bold">Offline Mode Active</span>
              <p className="text-[11px] opacity-90">
                Network is disconnected. Any uploaded file will be safely cached locally in the Offline Queue and uploaded when your connection is restored.
              </p>
            </div>
          </div>
        )}

        {/* Template Downloads */}
        <div className="p-3 rounded-xl neu-inset space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#3A0F34] dark:text-[#f6f1f7]">
              Need the exact columns template?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadSampleTemplate(entityType, "xlsx")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg neu-btn text-emerald-700 dark:text-emerald-400 font-semibold hover:scale-105 transition-transform cursor-pointer"
              >
                <FileSpreadsheet size={13} />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => downloadSampleTemplate(entityType, "csv")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg neu-btn text-amber-700 dark:text-amber-400 font-semibold hover:scale-105 transition-transform cursor-pointer"
              >
                <FileText size={13} />
                <span>CSV (.csv)</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#bdaec2]">
            Supports automatic detection of both <strong>Excel (.xlsx)</strong> and <strong>CSV (.csv)</strong> files. Columns will be auto-matched.
          </p>
        </div>

        {/* File Dropzone */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileProcess(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-[#EAAA00] bg-[#EAAA00]/10 scale-[1.01]"
                : "border-slate-300 dark:border-[#421743] hover:border-[#EAAA00] neu-inset"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-xl neu-btn mx-auto flex items-center justify-center text-[#EAAA00] mb-3">
              <Upload size={20} />
            </div>
            <p className="font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Click to select or drag &amp; drop file here
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Automatically detects Excel (.xlsx) and CSV (.csv) files (Up to 15 MB)
            </p>
          </div>
        ) : (
          <div className="neu-card p-4 space-y-3 border border-white/60 dark:border-[#421743]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-[#EAAA00]">
                  {detectedFormat === "xlsx" ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
                </div>
                <div>
                  <p className="font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Auto-detected format: <span className="uppercase font-bold text-[#EAAA00]">{detectedFormat}</span> · {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-rose-500 hover:underline cursor-pointer"
              >
                Change File
              </button>
            </div>

            {isParsing ? (
              <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                <Loader2 size={16} className="animate-spin text-[#EAAA00]" />
                <span>Auto-detecting columns and reading data rows…</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Preview: Ready to import {parsedRows.length} records
                  </span>
                  <Badge variant="primary" size="sm">
                    {detectedHeaders.length} Columns Found
                  </Badge>
                </div>

                {/* Table Preview */}
                <div className="max-h-44 overflow-auto rounded-xl neu-inset p-2">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-[#38163f]">
                        {detectedHeaders.slice(0, 6).map((h, i) => (
                          <th key={i} className="text-left py-1 px-2 font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 4).map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-200/50 dark:border-[#2d1433]">
                          {detectedHeaders.slice(0, 6).map((h, cIdx) => (
                            <td key={cIdx} className="py-1 px-2 text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                              {String(row[h] ?? "-")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 4 && (
                    <p className="text-[10px] text-center text-slate-400 py-1">
                      + {parsedRows.length - 4} more rows…
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl neu-inset text-rose-600 dark:text-rose-400">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary} disabled={isCommitting}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCommit}
            disabled={!selectedFile || parsedRows.length === 0 || isCommitting || isParsing}
            className={`${btnCls} flex items-center gap-2`}
          >
            {isCommitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing Upload…</span>
              </>
            ) : !isOnline ? (
              <>
                <WifiOff size={14} />
                <span>Save to Offline Queue ({parsedRows.length})</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>Commit Bulk Upload ({parsedRows.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Bulk Download Modal ──────────────────────────────────────────────────────
export interface BulkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: OfflineEntityType;
  title: string;
  data: Record<string, any>[];
  selectedIds?: number[] | string[];
}

export function BulkDownloadModal({
  isOpen,
  onClose,
  entityType,
  title,
  data,
  selectedIds = [],
}: BulkDownloadModalProps) {
  const { addToast } = useToast();
  const [format, setFormat] = useState<SupportedFormat>("xlsx");
  const [downloadMode, setDownloadMode] = useState<"all" | "selected">("all");
  const [isExporting, setIsExporting] = useState(false);

  const getColumns = (): ColumnDefinition[] => {
    switch (entityType) {
      case "patients":
        return PATIENT_COLUMNS;
      case "treatments":
        return TREATMENT_COLUMNS;
      case "injections":
        return INJECTION_COLUMNS;
      case "users":
        return USER_COLUMNS;
    }
  };

  const columns = getColumns();
  const [selectedCols, setSelectedCols] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  const handleToggleCol = (key: string) => {
    setSelectedCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = async () => {
    setIsExporting(true);

    const activeCols = columns
      .filter((c) => selectedCols[c.key])
      .map((c) => ({ key: c.key, label: c.label }));

    if (activeCols.length === 0) {
      addToast("error", "No Columns Selected", "Please select at least one column to export.");
      setIsExporting(false);
      return;
    }

    let recordsToExport = data;
    if (downloadMode === "selected" && selectedIds.length > 0) {
      recordsToExport = data.filter((item) =>
        (selectedIds as any[]).includes(item.patient_id ?? item.id)
      );
    }

    if (recordsToExport.length === 0) {
      addToast("warning", "No Records", "No records available for export.");
      setIsExporting(false);
      return;
    }

    try {
      const filename = `UMEED_${entityType}_bulk_${new Date().toISOString().slice(0, 10)}`;
      await exportToExcelOrCsv({
        filename,
        format,
        columns: activeCols,
        data: recordsToExport,
        sheetName: `${entityType.toUpperCase()} Export`,
      });

      // Record export in history
      await recordExportHistory({
        id: `exp-${Date.now().toString().slice(-6)}`,
        filename: `${filename}.${format}`,
        format,
        records_count: recordsToExport.length,
        status: "Completed",
        operator: "Clinical Operator",
      });

      addToast(
        "success",
        "Download Complete",
        `Downloaded ${recordsToExport.length} records in ${format.toUpperCase()} format.`
      );
      onClose();
    } catch (err: any) {
      addToast("error", "Export Failed", err.message || "Failed to generate file.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 text-xs">
        {/* Format Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
            1. Select Export Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormat("xlsx")}
              className={`p-3 rounded-xl flex items-center gap-2.5 font-bold transition-all cursor-pointer ${
                format === "xlsx"
                  ? "neu-inset text-emerald-600 dark:text-emerald-400 ring-2 ring-[#EAAA00]"
                  : "neu-card text-slate-600 dark:text-slate-300"
              }`}
            >
              <FileSpreadsheet size={18} className="text-emerald-500" />
              <div className="text-left">
                <div>Excel Workbook</div>
                <div className="text-[10px] font-normal text-slate-500">.xlsx format</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={`p-3 rounded-xl flex items-center gap-2.5 font-bold transition-all cursor-pointer ${
                format === "csv"
                  ? "neu-inset text-amber-600 dark:text-amber-400 ring-2 ring-[#EAAA00]"
                  : "neu-card text-slate-600 dark:text-slate-300"
              }`}
            >
              <FileText size={18} className="text-amber-500" />
              <div className="text-left">
                <div>Comma Separated</div>
                <div className="text-[10px] font-normal text-slate-500">.csv format</div>
              </div>
            </button>
          </div>
        </div>

        {/* Dataset Scope */}
        {selectedIds.length > 0 && (
          <div className="space-y-1.5">
            <label className="font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              2. Records Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDownloadMode("selected")}
                className={`py-2 px-3 rounded-xl font-semibold text-xs cursor-pointer ${
                  downloadMode === "selected"
                    ? "neu-btn bg-[#EAAA00] text-[#190617] font-bold"
                    : "neu-card text-slate-600 dark:text-slate-300"
                }`}
              >
                Selected Only ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => setDownloadMode("all")}
                className={`py-2 px-3 rounded-xl font-semibold text-xs cursor-pointer ${
                  downloadMode === "all"
                    ? "neu-btn bg-[#EAAA00] text-[#190617] font-bold"
                    : "neu-card text-slate-600 dark:text-slate-300"
                }`}
              >
                All Records ({data.length})
              </button>
            </div>
          </div>
        )}

        {/* Column Selectors */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Include Columns ({Object.values(selectedCols).filter(Boolean).length} / {columns.length})
            </label>
            <div className="flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setSelectedCols(columns.reduce((acc, c) => ({ ...acc, [c.key]: true }), {}))
                }
                className="text-[#EAAA00] hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() =>
                  setSelectedCols(columns.reduce((acc, c) => ({ ...acc, [c.key]: false }), {}))
                }
                className="text-slate-400 hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto rounded-xl neu-inset p-2.5 grid grid-cols-2 gap-2">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={!!selectedCols[col.key]}
                  onChange={() => handleToggleCol(col.key)}
                  className="rounded text-[#EAAA00] focus:ring-[#EAAA00]"
                />
                <span className="truncate">{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary} disabled={isExporting}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            className={`${btnCls} flex items-center gap-2`}
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Exporting…</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>
                  Download {format.toUpperCase()} (
                  {downloadMode === "selected" && selectedIds.length > 0
                    ? selectedIds.length
                    : data.length}{" "}
                  Records)
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
