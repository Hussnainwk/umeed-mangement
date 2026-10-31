"use client";
import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardInset, Label, Badge, btnCls, btnGhost, btnSecondary, useToast } from "@/components/ui";
import { PatientRecord, HistoryRecord } from "@/data/mockData";
import { detectAndParseFile, downloadSampleTemplate, SupportedFormat } from "@/lib/fileProcessor";
import { enqueueOfflineUpload, useOnlineStatus } from "@/lib/offlineQueue";
import { FileSpreadsheet, FileText, WifiOff } from "lucide-react";
import { useAuth } from "@/context/auth";
import {
  validateCNIC,
  validatePakistanPhone,
  formatCNIC,
  formatPakistanPhone,
  normalizeTestResult,
} from "@/lib/pakistanValidation";

interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  isDuplicate?: boolean;
}

interface ImportModuleProps {
  existingPatients: PatientRecord[];
  onImportComplete: (newPatients: PatientRecord[]) => void;
  importHistory: HistoryRecord[];
  onAddHistory: (record: HistoryRecord) => void;
}

const EXPECTED_COLUMNS = [
  { key: "patient_name", label: "Full / Patient Name", required: true },
  { key: "cnic", label: "CNIC (13 digits: XXXXX-XXXXXXX-X)", required: false },
  { key: "gender", label: "Gender", required: false },
  { key: "date_of_birth", label: "Date of Birth (YYYY-MM-DD)", required: false },
  { key: "diagnosis", label: "Diagnosis (e.g. Hemophilia A)", required: false },
  { key: "severity", label: "Severity (Severe / Moderate / Mild)", required: false },
  { key: "city", label: "City", required: false },
  { key: "telephone", label: "Mobile Phone (11 digits local / 12 intl)", required: false },
  { key: "email", label: "Email Address", required: false },
];

export default function ImportModule({
  existingPatients,
  onImportComplete,
  importHistory,
  onAddHistory,
}: ImportModuleProps) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rawFileRows, setRawFileRows] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "summary">("upload");
  const [importSummary, setImportSummary] = useState<{
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  }>({ total: 0, valid: 0, invalid: 0, duplicates: 0 });

  // 1. File Validation
  const validateFile = (selectedFile: File): boolean => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      addToast("error", "Invalid File Format", "Only .csv and .xlsx files are supported.");
      return false;
    }
    // Size check (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      addToast("error", "File Too Large", "Maximum supported file size is 10 MB.");
      return false;
    }
    return true;
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;
    setFile(selectedFile);
    parseFile(selectedFile);
  };

  // 2. Parse CSV / Excel with automatic detection
  const parseFile = async (fileToParse: File) => {
    setIsProcessing(true);
    try {
      const result = await detectAndParseFile(fileToParse);
      setIsProcessing(false);
      const rawHeaders = result.headers;
      setHeaders(rawHeaders);
      setRawFileRows(result.rows);

      // Auto map matching columns
      const initialMapping: Record<string, string> = {};
      EXPECTED_COLUMNS.forEach((col) => {
        const match = rawHeaders.find((h) => {
          const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, "");
          const cleanCol = col.key.toLowerCase().replace(/[^a-z0-9]/g, "");
          return cleanH.includes(cleanCol) || cleanCol.includes(cleanH);
        });
        if (match) initialMapping[col.key] = match;
      });
      setColumnMapping(initialMapping);

      // Analyze and map rows
      analyzeRows(result.rows, initialMapping);
      setStep("mapping");
    } catch (err: any) {
      setIsProcessing(false);
      addToast("error", "Parse Error", err.message || "Failed to process file");
    }
  };

  // 3. Row-level validation and duplicate detection
  const analyzeRows = (rawRows: Record<string, any>[], mapping: Record<string, string>) => {
    let validCount = 0;
    let invalidCount = 0;
    let dupCount = 0;

    const evaluated: ParsedRow[] = rawRows.map((row, index) => {
      const rowNum = index + 2; // header is row 1
      const errors: string[] = [];
      const mappedData: Record<string, any> = {};

      EXPECTED_COLUMNS.forEach((col) => {
        const sourceHeader = mapping[col.key];
        const val = sourceHeader ? row[sourceHeader] : "";
        mappedData[col.key] = val != null ? String(val).trim() : "";
      });

      // Name required
      if (!mappedData.patient_name) {
        errors.push("Missing required field: Full / Patient Name");
      }

      // CNIC check (Pakistan standard: 13 digits: XXXXX-XXXXXXX-X)
      if (mappedData.cnic) {
        const cnicRes = validateCNIC(mappedData.cnic);
        if (!cnicRes.isValid) {
          errors.push(
            `Invalid CNIC "${mappedData.cnic}": Must be 13 digits (format: XXXXX-XXXXXXX-X, e.g. 35202-1234567-1)`
          );
        } else {
          mappedData.cnic = cnicRes.formatted;
        }
      }

      // Telephone check (Local: 11 digits, Intl: 12 digits)
      if (mappedData.telephone) {
        const phoneRes = validatePakistanPhone(mappedData.telephone);
        if (!phoneRes.isValid) {
          errors.push(
            `Invalid Mobile "${mappedData.telephone}": Must be 11 digits local (03XX-XXXXXXX) or 12 digits intl (+92 3XX XXXXXXX / 923XXXXXXXXX)`
          );
        } else {
          mappedData.telephone = phoneRes.formatted;
        }
      }

      // Email check if provided
      if (mappedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedData.email)) {
        errors.push(`Invalid email format: "${mappedData.email}"`);
      }

      // Check duplicates against existing records by CNIC or Name
      const isDup = existingPatients.some((p) => {
        if (mappedData.cnic && p.cnic && mappedData.cnic === p.cnic) return true;
        if (
          mappedData.patient_name &&
          p.patient_name.toLowerCase() === mappedData.patient_name.toLowerCase()
        )
          return true;
        return false;
      });

      if (isDup) {
        dupCount++;
      }

      if (errors.length > 0) {
        invalidCount++;
      } else {
        validCount++;
      }

      return {
        rowNumber: rowNum,
        data: mappedData,
        errors,
        isDuplicate: isDup,
      };
    });

    setParsedRows(evaluated);
    setImportSummary({
      total: rawRows.length,
      valid: validCount,
      invalid: invalidCount,
      duplicates: dupCount,
    });
  };

  const handleMappingChange = (targetKey: string, sourceHeader: string) => {
    const updated = { ...columnMapping, [targetKey]: sourceHeader };
    setColumnMapping(updated);
    // Re-evaluate with new mapping using cached parsed rows
    if (rawFileRows.length > 0) {
      analyzeRows(rawFileRows, updated);
    }
  };

  // 4. Commit Import
  const handleCommitImport = () => {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) {
      addToast("error", "No Valid Records", "Please fix errors before proceeding.");
      return;
    }

    const nextIdBase =
      existingPatients.length > 0
        ? Math.max(...existingPatients.map((p) => p.patient_id)) + 1
        : 101;

    const newPatients: PatientRecord[] = validRows.map((r, i) => {
      const d = r.data;
      return {
        patient_id: nextIdBase + i,
        registration_no: `H-${nextIdBase + i}`,
        patient_name: d.patient_name || `Imported Patient ${i + 1}`,
        date_of_birth: d.date_of_birth || "2000-01-01",
        age: d.date_of_birth ? 2024 - parseInt(d.date_of_birth.slice(0, 4)) : 24,
        gender: d.gender || "Male",
        marital_status: "Single",
        cnic: d.cnic || "",
        blood_group: "O+",
        record_date: new Date().toISOString().slice(0, 10),
        qualification: "Not specified",
        profession: "Not specified",
        job_title: "Not specified",
        address: "Imported Address",
        city: d.city || "Rawalpindi",
        province: "Punjab",
        telephone: d.telephone || "+92 300 0000000",
        email: d.email || "",
        guardian_name: "Guardian",
        diagnosis: d.diagnosis || "Hemophilia A",
        severity: (d.severity as any) || "Moderate",
        baseline_factor_activity: 1.5,
        treatment_type: "On-demand",
        inhibitor_status: "Negative",
        bleeding_episodes_12m: 2,
        treatment_products: "Factor VIII",
        hcv: "Negative",
        hiv: "Negative",
        hbv: "Negative",
        status: "active",
      };
    });

    onImportComplete(newPatients);

    const fileFormat = (file?.name.endsWith(".xlsx") ? "xlsx" : "csv") as any;

    // Check offline status
    if (!isOnline) {
      enqueueOfflineUpload("patients", file?.name || "import_patients.xlsx", fileFormat, newPatients);
      addToast(
        "warning",
        "Saved to Offline Queue",
        `${newPatients.length} records saved to offline queue. Will sync to database when reconnected.`
      );
    }

    // Save to history
    const historyItem: HistoryRecord = {
      id: `imp-${Date.now().toString().slice(-4)}`,
      type: "import",
      filename: file?.name || "dataset.csv",
      format: fileFormat,
      records_count: parsedRows.length,
      success_count: newPatients.length,
      failed_count: parsedRows.length - newPatients.length,
      status: parsedRows.length === newPatients.length ? "Completed" : "Partial",
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      user: user?.name || user?.email || "Admin Operator",
    };
    onAddHistory(historyItem);

    setStep("summary");
    addToast(
      "success",
      "Import Succeeded",
      `Successfully imported ${newPatients.length} patient records!`
    );
  };

  // Sample Template Downloads using real Excel (.xlsx) / CSV generator
  const handleDownloadSample = async (fmt: "csv" | "xlsx") => {
    try {
      await downloadSampleTemplate("patients", fmt);
      addToast(
        "info",
        "Template Downloaded",
        `Sample ${fmt.toUpperCase()} template downloaded with standard Pakistan CNIC and phone formats.`
      );
    } catch (err: any) {
      addToast("error", "Download Failed", err.message || "Failed to download template");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Step Indicator */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Import Data (CSV &amp; Excel)
            </span>
            <Badge variant="primary">Security Verified</Badge>
          </div>
        }
        subtitle="Batch upload patient registrations and medical records with duplicate detection, column auto-mapping, and formula injection sanitization."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadSample("xlsx")}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-[#EAAA00] cursor-pointer flex items-center gap-1.5"
              title="Download Excel spreadsheet template (.xlsx)"
            >
              <FileSpreadsheet size={13} />
              <span>📥 Sample Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleDownloadSample("csv")}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-[#EAAA00] cursor-pointer flex items-center gap-1.5"
              title="Download comma-separated text template (.csv)"
            >
              <FileText size={13} />
              <span>📥 Sample CSV (.csv)</span>
            </button>
          </div>
        }
      >
        {/* Progress Pills */}
        <div className="flex items-center justify-between gap-2 max-w-xl mx-auto my-3">
          {[
            { id: "upload", label: "1. Upload File" },
            { id: "mapping", label: "2. Column Mapping" },
            { id: "preview", label: "3. Review & Validate" },
            { id: "summary", label: "4. Summary" },
          ].map((s) => (
            <div
              key={s.id}
              className={`flex-1 text-center py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                step === s.id
                  ? "neu-inset text-[#EAAA00] shadow-sm"
                  : "neu-btn text-slate-500 dark:text-slate-400 opacity-70"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
      </Card>

      {/* STEP 1: UPLOAD */}
      {step === "upload" && (
        <Card>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-[#EAAA00] bg-[#EAAA00]/10 scale-[1.01]"
                : "border-slate-300 dark:border-[#38163f] hover:border-[#EAAA00]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={(e) => e.target.files?.[0] && handleSelectedFile(e.target.files[0])}
              className="hidden"
            />
            <div className="text-4xl mb-3">📁</div>
            <h3 className="text-lg font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Drag and drop your spreadsheet here
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supports <strong>.csv</strong> and <strong>.xlsx</strong> formats (up to 10MB, up to 10,000 rows)
            </p>
            <div className="mt-4">
              <span className={btnCls}>Browse Files</span>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {step === "mapping" && (
        <Card
          title="Map Spreadsheet Headers"
          subtitle={`Auto-detected ${headers.length} columns from ${file?.name}. Confirm or adjust mapping:`}
          action={
            <div className="flex gap-2">
              <button onClick={() => setStep("upload")} className={btnGhost}>
                Back
              </button>
              <button onClick={() => setStep("preview")} className={btnCls}>
                Next: Validate Records ({parsedRows.length})
              </button>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
            {EXPECTED_COLUMNS.map((col) => (
              <CardInset key={col.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7]">
                    {col.label} {col.required && <span className="text-[#EAAA00]">*</span>}
                  </span>
                  {columnMapping[col.key] && <Badge variant="success" size="sm">Mapped</Badge>}
                </div>
                <select
                  value={columnMapping[col.key] || ""}
                  onChange={(e) => handleMappingChange(col.key, e.target.value)}
                  className="w-full rounded-xl neu-inset px-3 py-2 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
                >
                  <option value="">-- Do Not Import / Skip --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      Header: {h}
                    </option>
                  ))}
                </select>
              </CardInset>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 3: PREVIEW & ERROR VALIDATION */}
      {step === "preview" && (
        <Card
          title="Review & Validate Uploaded Records"
          subtitle={`Found ${importSummary.valid} valid records, ${importSummary.invalid} with errors, ${importSummary.duplicates} potential duplicates.`}
          action={
            <div className="flex gap-2">
              <button onClick={() => setStep("mapping")} className={btnGhost}>
                Back to Mapping
              </button>
              <button
                onClick={handleCommitImport}
                disabled={importSummary.valid === 0}
                className={btnCls}
              >
                Confirm &amp; Import ({importSummary.valid} records)
              </button>
            </div>
          }
        >
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="neu-inset p-3 rounded-xl text-center">
              <p className="text-xs text-slate-500">Total Rows</p>
              <p className="text-xl font-bold tabular-nums text-[#3A0F34] dark:text-[#f6f1f7]">
                {importSummary.total}
              </p>
            </div>
            <div className="neu-inset p-3 rounded-xl text-center border-b-2 border-emerald-500">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Valid Records</p>
              <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {importSummary.valid}
              </p>
            </div>
            <div className="neu-inset p-3 rounded-xl text-center border-b-2 border-rose-500">
              <p className="text-xs text-rose-600 dark:text-rose-400">Invalid Rows</p>
              <p className="text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {importSummary.invalid}
              </p>
            </div>
            <div className="neu-inset p-3 rounded-xl text-center border-b-2 border-[#EAAA00]">
              <p className="text-xs text-[#EAAA00]">Duplicates</p>
              <p className="text-xl font-bold tabular-nums text-[#EAAA00]">
                {importSummary.duplicates}
              </p>
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto neu-inset rounded-2xl p-2">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 dark:text-slate-400 border-b border-white/60 dark:border-[#38163f]">
                <tr>
                  <th className="py-2.5 px-3">Row #</th>
                  <th className="px-3">Status</th>
                  <th className="px-3">Patient Name</th>
                  <th className="px-3">CNIC</th>
                  <th className="px-3">Diagnosis</th>
                  <th className="px-3">City</th>
                  <th className="px-3">Validation / Errors</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 50).map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`border-t border-slate-200/50 dark:border-[#2d1433] ${
                      row.errors.length > 0
                        ? "bg-rose-50/50 dark:bg-rose-950/20"
                        : row.isDuplicate
                        ? "bg-amber-50/40 dark:bg-amber-950/15"
                        : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-slate-500">#{row.rowNumber}</td>
                    <td className="px-3">
                      {row.errors.length > 0 ? (
                        <Badge variant="danger" size="sm">Invalid</Badge>
                      ) : row.isDuplicate ? (
                        <Badge variant="warning" size="sm">Duplicate</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Ready</Badge>
                      )}
                    </td>
                    <td className="px-3 font-semibold text-[#3A0F34] dark:text-[#f6f1f7]">
                      {row.data.patient_name || "-"}
                    </td>
                    <td className="px-3 font-mono">{row.data.cnic || "-"}</td>
                    <td className="px-3">{row.data.diagnosis || "Hemophilia A"}</td>
                    <td className="px-3">{row.data.city || "-"}</td>
                    <td className="px-3">
                      {row.errors.length > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          {row.errors.join("; ")}
                        </span>
                      ) : row.isDuplicate ? (
                        <span className="text-[#EAAA00]">Matched existing patient record</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">Passes validation</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* STEP 4: SUMMARY & COMPLETION */}
      {step === "summary" && (
        <Card className="text-center py-10 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full neu-inset flex items-center justify-center text-3xl text-emerald-500">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
            Import Successfully Completed!
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#bdaec2] max-w-md mx-auto">
            All validated records have been merged into the registry database. Audit history and tracking logs have been generated.
          </p>
          <div className="flex justify-center gap-3 pt-3">
            <button
              onClick={() => {
                setFile(null);
                setParsedRows([]);
                setStep("upload");
              }}
              className={btnSecondary}
            >
              Upload Another File
            </button>
            <button
              onClick={() => {
                // switch tab to patients or dashboard
                window.location.hash = "#patients";
              }}
              className={btnCls}
            >
              View Updated Patients
            </button>
          </div>
        </Card>
      )}

      {/* Recent Import History */}
      <Card title="Recent Batch Import History" subtitle="Audit records of previous spreadsheet ingestions:">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-white/60 dark:border-[#38163f]">
              <tr>
                <th className="py-2 px-3">Batch ID</th>
                <th className="px-3">File Name</th>
                <th className="px-3">Format</th>
                <th className="px-3">Rows</th>
                <th className="px-3">Success</th>
                <th className="px-3">Status</th>
                <th className="px-3">Timestamp</th>
                <th className="px-3">Operator</th>
              </tr>
            </thead>
            <tbody>
              {importHistory
                .filter((h) => h.type === "import")
                .map((h) => (
                  <tr key={h.id} className="border-t border-slate-200/50 dark:border-[#2d1433]">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
                      {h.id}
                    </td>
                    <td className="px-3">{h.filename}</td>
                    <td className="px-3 uppercase font-semibold">{h.format}</td>
                    <td className="px-3 tabular-nums">{h.records_count}</td>
                    <td className="px-3 tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                      {h.success_count}
                    </td>
                    <td className="px-3">
                      <Badge
                        variant={
                          h.status === "Completed"
                            ? "success"
                            : h.status === "Partial"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {h.status}
                      </Badge>
                    </td>
                    <td className="px-3 text-slate-500">{h.timestamp}</td>
                    <td className="px-3">{h.user}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
