"use client";
import React, { useState } from "react";
import { Card, CardInset, Label, Badge, btnCls, btnGhost, useToast } from "@/components/ui";
import { PatientRecord, TreatmentRecord, HistoryRecord } from "@/data/mockData";
import { exportToExcelOrCsv } from "@/lib/fileProcessor";
import { useAuth } from "@/context/auth";

interface ExportModuleProps {
  patients: PatientRecord[];
  treatments: TreatmentRecord[];
  exportHistory: HistoryRecord[];
  onAddHistory: (record: HistoryRecord) => void;
}

const AVAILABLE_PATIENT_COLUMNS = [
  { key: "registration_no", label: "Registration No (H-#)", defaultChecked: true },
  { key: "patient_name", label: "Patient Full Name", defaultChecked: true },
  { key: "cnic", label: "National CNIC", defaultChecked: true },
  { key: "gender", label: "Gender", defaultChecked: true },
  { key: "date_of_birth", label: "Date of Birth", defaultChecked: false },
  { key: "age", label: "Derived Age (Years)", defaultChecked: true },
  { key: "blood_group", label: "Blood Group", defaultChecked: true },
  { key: "marital_status", label: "Marital Status", defaultChecked: false },
  { key: "qualification", label: "Qualification", defaultChecked: false },
  { key: "profession", label: "Profession", defaultChecked: false },
  { key: "job_title", label: "Job Title", defaultChecked: false },
  { key: "address", label: "Residential Address", defaultChecked: false },
  { key: "city", label: "City", defaultChecked: true },
  { key: "city_town", label: "City / Town", defaultChecked: false },
  { key: "province", label: "Province", defaultChecked: true },
  { key: "telephone", label: "Telephone Contact", defaultChecked: true },
  { key: "emergency_number", label: "Emergency Phone", defaultChecked: false },
  { key: "email", label: "Email Address", defaultChecked: false },
  { key: "guardian_name", label: "Guardian / Father Name", defaultChecked: true },
  { key: "guardian_cnic", label: "Guardian CNIC", defaultChecked: false },
  { key: "household_other_bleeder", label: "Household Other Bleeder", defaultChecked: false },
  { key: "household_patient_name", label: "Household Bleeder Name", defaultChecked: false },
  { key: "household_relation", label: "Household Bleeder Relation", defaultChecked: false },
  { key: "diagnosis", label: "Diagnosis Category", defaultChecked: true },
  { key: "registered_with_chapter", label: "Registered with Chapter", defaultChecked: false },
  { key: "chapter_name", label: "Chapter Name", defaultChecked: false },
  { key: "diagnostic_technique", label: "Diagnostic Technique", defaultChecked: false },
  { key: "diagnostic_other", label: "Other Diagnostics", defaultChecked: false },
  { key: "baseline_factor_activity", label: "Baseline Factor Activity (%)", defaultChecked: true },
  { key: "diagnostic_reason", label: "Diagnostic Reason", defaultChecked: false },
  { key: "diagnostic_reason_other", label: "Other Diagnostic Reason", defaultChecked: false },
  { key: "age_first_diagnosed", label: "Age First Diagnosed", defaultChecked: false },
  { key: "severity", label: "Clinical Severity", defaultChecked: true },
  { key: "treatment_type", label: "Treatment Modality", defaultChecked: true },
  { key: "inhibitor_status", label: "Inhibitor Status", defaultChecked: true },
  { key: "bleeding_episodes_12m", label: "Bleeds in Last 12M", defaultChecked: false },
  { key: "treatment_products", label: "Products Used", defaultChecked: false },
  { key: "hcv", label: "HCV Status", defaultChecked: true },
  { key: "hiv", label: "HIV Status", defaultChecked: true },
  { key: "hbv", label: "HBV Status", defaultChecked: true },
  { key: "vaccinations", label: "Vaccinations", defaultChecked: false },
  { key: "other_vaccinations", label: "Other Vaccinations", defaultChecked: false },
  { key: "joint_deformity", label: "Joint Deformity", defaultChecked: false },
  { key: "activity_level", label: "Activity Level", defaultChecked: false },
  { key: "filled_by", label: "Form Filled By (Operator)", defaultChecked: false },
  { key: "designation", label: "Operator Designation", defaultChecked: false },
  { key: "organization", label: "Operator Organization", defaultChecked: false },
  { key: "comments", label: "Clinical Notes / Comments", defaultChecked: false },
  { key: "record_date", label: "Registration Date", defaultChecked: true },
  { key: "status", label: "Account / Record Status", defaultChecked: true },
];

export default function ExportModule({
  patients,
  treatments,
  exportHistory,
  onAddHistory,
}: ExportModuleProps) {
  const { addToast } = useToast();
  const { user } = useAuth();

  const [datasetType, setDatasetType] = useState<"patients" | "treatments">("patients");
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [sanitizeFormulas, setSanitizeFormulas] = useState(true);
  const [selectedCols, setSelectedCols] = useState<Record<string, boolean>>(
    AVAILABLE_PATIENT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: col.defaultChecked }), {})
  );

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterDiagnosis, setFilterDiagnosis] = useState<string>("all");
  const [filterProvince, setFilterProvince] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  // Filtered dataset
  const filteredPatients = patients.filter((p) => {
    if (filterSeverity !== "all" && p.severity !== filterSeverity) return false;
    if (filterDiagnosis !== "all" && p.diagnosis !== filterDiagnosis) return false;
    if (filterProvince !== "all" && p.province !== filterProvince) return false;
    return true;
  });

  const toggleColumn = (key: string) => {
    setSelectedCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllCols = (select: boolean) => {
    setSelectedCols(
      AVAILABLE_PATIENT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: select }), {})
    );
  };

  const handleExport = async () => {
    setIsExporting(true);

    const activeCols = AVAILABLE_PATIENT_COLUMNS.filter((col) => selectedCols[col.key]);

    if (activeCols.length === 0) {
      addToast("error", "No Columns Selected", "Please select at least one column to export.");
      setIsExporting(false);
      return;
    }

    const recordsToExport = datasetType === "patients" ? filteredPatients : treatments;

    if (recordsToExport.length === 0) {
      addToast("warning", "Empty Export", "No records match the current filters.");
      setIsExporting(false);
      return;
    }

    try {
      const filename = `umeed_${datasetType}_export_${new Date()
        .toISOString()
        .slice(0, 10)}`;

      await exportToExcelOrCsv({
        filename,
        format,
        columns: activeCols.map((c) => ({ key: c.key, label: c.label })),
        data: recordsToExport,
        sheetName: `${datasetType.toUpperCase()} Export`,
      });

      // Record in History
      const historyItem: HistoryRecord = {
        id: `exp-${Date.now().toString().slice(-4)}`,
        type: "export",
        filename: `${filename}.${format}`,
        format,
        records_count: recordsToExport.length,
        success_count: recordsToExport.length,
        failed_count: 0,
        status: "Completed",
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        user: user?.name || user?.email || "Clinical Operator",
      };
      onAddHistory(historyItem);

      setIsExporting(false);
      addToast(
        "success",
        "Export Generated",
        `Successfully downloaded ${recordsToExport.length} records as ${filename}.${format}`
      );
    } catch (err: any) {
      setIsExporting(false);
      addToast("error", "Export Failed", err.message || "Failed to generate export file");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Export Data &amp; Reports
            </span>
            <Badge variant="primary">Sanitized Against Formula Injection</Badge>
          </div>
        }
        subtitle="Export full or filtered registries to CSV or Excel (.xlsx) with granular column selection and spreadsheet injection shielding."
        action={
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`${btnCls} flex items-center gap-2`}
          >
            {isExporting ? "Generating..." : "⚡ Generate & Download Export"}
          </button>
        }
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 pt-2">
          {/* Format Selection */}
          <CardInset className="space-y-2">
            <p className="text-xs font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              1. Export Format
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat("xlsx")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  format === "xlsx"
                    ? "neu-btn bg-[#EAAA00] text-[#190617] font-extrabold shadow-sm"
                    : "neu-btn text-slate-600 dark:text-slate-300"
                }`}
              >
                <span>📊 Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => setFormat("csv")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  format === "csv"
                    ? "neu-btn bg-[#EAAA00] text-[#190617] font-extrabold shadow-sm"
                    : "neu-btn text-slate-600 dark:text-slate-300"
                }`}
              >
                <span>📄 CSV (.csv)</span>
              </button>
            </div>
          </CardInset>

          {/* Dataset Type */}
          <CardInset className="space-y-2">
            <p className="text-xs font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              2. Target Dataset
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDatasetType("patients")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  datasetType === "patients"
                    ? "neu-btn bg-[#EAAA00] text-[#190617]"
                    : "neu-btn text-slate-600 dark:text-slate-300"
                }`}
              >
                Patients ({patients.length})
              </button>
              <button
                onClick={() => setDatasetType("treatments")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  datasetType === "treatments"
                    ? "neu-btn bg-[#EAAA00] text-[#190617]"
                    : "neu-btn text-slate-600 dark:text-slate-300"
                }`}
              >
                Treatments ({treatments.length})
              </button>
            </div>
          </CardInset>

          {/* Security & Headers Toggles */}
          <CardInset className="space-y-2">
            <p className="text-xs font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              3. Protection &amp; Headers
            </p>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#3A0F34] dark:text-[#f6f1f7]">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="rounded accent-[#EAAA00]"
                />
                Include Column Headers
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[#3A0F34] dark:text-[#f6f1f7]">
                <input
                  type="checkbox"
                  checked={sanitizeFormulas}
                  onChange={(e) => setSanitizeFormulas(e.target.checked)}
                  className="rounded accent-[#EAAA00]"
                />
                Escape Formulas (=, +, -, @)
              </label>
            </div>
          </CardInset>

          {/* Scope KPI */}
          <CardInset className="space-y-1 text-center flex flex-col justify-center">
            <p className="text-[11px] text-slate-500">Records to Export</p>
            <p className="text-2xl font-bold tabular-nums text-[#3A0F34] dark:text-[#f6f1f7]">
              {datasetType === "patients" ? filteredPatients.length : treatments.length}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
              Ready for immediate download
            </p>
          </CardInset>
        </div>
      </Card>

      {/* Filter Bar */}
      {datasetType === "patients" && (
        <Card title="Filter Export Scope" subtitle="Optionally constrain the export to specific cohorts:">
          <div className="grid gap-4 sm:grid-cols-3 pt-1">
            <Label text="Filter by Clinical Severity">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full rounded-xl neu-inset px-3 py-2 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
              >
                <option value="all">All Severities</option>
                <option value="Severe">Severe (&lt; 1% activity)</option>
                <option value="Moderate">Moderate (1-5% activity)</option>
                <option value="Mild">Mild (&gt; 5% activity)</option>
              </select>
            </Label>

            <Label text="Filter by Diagnosis">
              <select
                value={filterDiagnosis}
                onChange={(e) => setFilterDiagnosis(e.target.value)}
                className="w-full rounded-xl neu-inset px-3 py-2 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
              >
                <option value="all">All Diagnoses</option>
                <option value="Hemophilia A">Hemophilia A</option>
                <option value="Hemophilia B">Hemophilia B</option>
                <option value="von Willebrand disease">von Willebrand disease</option>
                <option value="Factor VII deficiency">Factor VII deficiency</option>
              </select>
            </Label>

            <Label text="Filter by Province">
              <select
                value={filterProvince}
                onChange={(e) => setFilterProvince(e.target.value)}
                className="w-full rounded-xl neu-inset px-3 py-2 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
              >
                <option value="all">All Provinces</option>
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                <option value="KPK">KPK</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Islamabad">Islamabad</option>
              </select>
            </Label>
          </div>
        </Card>
      )}

      {/* Column Selection Checklist */}
      <Card
        title="Choose Export Columns"
        subtitle="Select which fields should be included in the downloadable file:"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => selectAllCols(true)}
              className="text-xs text-[#EAAA00] hover:underline font-semibold cursor-pointer"
            >
              Select All
            </button>
            <span className="text-slate-400">|</span>
            <button
              onClick={() => selectAllCols(false)}
              className="text-xs text-slate-500 hover:underline cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pt-2">
          {AVAILABLE_PATIENT_COLUMNS.map((col) => (
            <label
              key={col.key}
              className={`p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                selectedCols[col.key]
                  ? "neu-inset text-[#3A0F34] dark:text-[#f6f1f7] font-semibold"
                  : "neu-btn text-slate-500 opacity-60"
              }`}
            >
              <input
                type="checkbox"
                checked={!!selectedCols[col.key]}
                onChange={() => toggleColumn(col.key)}
                className="rounded accent-[#EAAA00] cursor-pointer"
              />
              <span className="text-xs">{col.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Export History Table */}
      <Card title="Export History &amp; Audit Logs" subtitle="Past downloads and generated spreadsheets:">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-white/60 dark:border-[#38163f]">
              <tr>
                <th className="py-2 px-3">Batch ID</th>
                <th className="px-3">File Name</th>
                <th className="px-3">Format</th>
                <th className="px-3">Rows</th>
                <th className="px-3">Status</th>
                <th className="px-3">Date &amp; Time</th>
                <th className="px-3">Exported By</th>
              </tr>
            </thead>
            <tbody>
              {exportHistory
                .filter((h) => h.type === "export")
                .map((h) => (
                  <tr key={h.id} className="border-t border-slate-200/50 dark:border-[#2d1433]">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
                      {h.id}
                    </td>
                    <td className="px-3">{h.filename}</td>
                    <td className="px-3 uppercase font-semibold">{h.format}</td>
                    <td className="px-3 tabular-nums font-bold">{h.records_count}</td>
                    <td className="px-3">
                      <Badge variant="success">Completed</Badge>
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
