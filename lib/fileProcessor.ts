import ExcelJS from "exceljs";
import Papa from "papaparse";

export type SupportedFormat = "csv" | "xlsx";

export interface ColumnDefinition {
  key: string;
  label: string;
  required?: boolean;
  type?: "string" | "number" | "date" | "boolean";
  example?: string | number | boolean;
}

export interface ParsedDataResult {
  format: SupportedFormat;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

// ── Column Schemas based on Supabase database tables ──────────────────────────

export const PATIENT_COLUMNS: ColumnDefinition[] = [
  { key: "patient_name", label: "Patient Full Name", required: true, example: "Muhammad Ali" },
  { key: "registration_no", label: "Registration No (H-#)", required: false, example: "H-101" },
  { key: "cnic", label: "CNIC (13 digits: XXXXX-XXXXXXX-X)", required: false, example: "35202-1234567-1" },
  { key: "date_of_birth", label: "Date of Birth (YYYY-MM-DD)", required: false, example: "1998-05-14" },
  { key: "gender", label: "Gender (Male/Female/Other)", required: false, example: "Male" },
  { key: "blood_group", label: "Blood Group (A+/A-/B+/B-/AB+/AB-/O+/O-)", required: false, example: "O+" },
  { key: "marital_status", label: "Marital Status", required: false, example: "Single" },
  { key: "qualification", label: "Qualification", required: false, example: "Bachelors" },
  { key: "profession", label: "Profession", required: false, example: "Teacher" },
  { key: "job_title", label: "Job Title", required: false, example: "Instructor" },
  { key: "address", label: "Residential Address", required: false, example: "House 12, Street 4" },
  { key: "city", label: "City", required: false, example: "Rawalpindi" },
  { key: "city_town", label: "City / Town", required: false, example: "Saddar" },
  { key: "province", label: "Province", required: false, example: "Punjab" },
  { key: "telephone", label: "Mobile Phone (11 digits: 03XX-XXXXXXX or 12 digits: +92 3XX XXXXXXX)", required: false, example: "0300-1234567" },
  { key: "emergency_number", label: "Emergency Phone", required: false, example: "0321-7654321" },
  { key: "email", label: "Email Address", required: false, example: "ali@example.com" },
  { key: "guardian_name", label: "Guardian / Parent Name", required: false, example: "Tariq Ali" },
  { key: "guardian_cnic", label: "Guardian CNIC (13 digits: XXXXX-XXXXXXX-X)", required: false, example: "35202-7654321-1" },
  { key: "household_other_bleeder", label: "Household Other Bleeder (true/false)", required: false, example: false },
  { key: "household_patient_name", label: "Household Bleeder Name", required: false, example: "" },
  { key: "household_relation", label: "Household Bleeder Relation", required: false, example: "" },
  { key: "diagnosis", label: "Diagnosis", required: false, example: "Hemophilia A" },
  { key: "registered_with_chapter", label: "Registered with Chapter (true/false)", required: false, example: true },
  { key: "chapter_name", label: "Chapter / HTC Name", required: false, example: "UWF Rawalpindi" },
  { key: "diagnostic_technique", label: "Diagnostic Technique", required: false, example: "Factor assay" },
  { key: "diagnostic_other", label: "Other Diagnostics", required: false, example: "" },
  { key: "baseline_factor_activity", label: "Factor Activity (%)", required: false, example: 1.5 },
  { key: "diagnostic_reason", label: "Reason for Diagnostic", required: false, example: "Bleeding symptoms" },
  { key: "diagnostic_reason_other", label: "Other Diagnostic Reason", required: false, example: "" },
  { key: "age_first_diagnosed", label: "Age First Diagnosed", required: false, example: 2 },
  { key: "treatment_type", label: "Treatment Modality", required: false, example: "On-demand" },
  { key: "inhibitor_status", label: "Inhibitor Status (Positive/Negative/Not tested)", required: false, example: "Negative" },
  { key: "bleeding_episodes_12m", label: "Bleeds (Last 12M)", required: false, example: 2 },
  { key: "treatment_products", label: "Products Used", required: false, example: "Factor VIII" },
  { key: "hcv", label: "HCV Status (Positive/Negative/Not tested)", required: false, example: "Negative" },
  { key: "hiv", label: "HIV Status (Positive/Negative/Not tested)", required: false, example: "Negative" },
  { key: "hbv", label: "HBV Status (Positive/Negative/Not tested)", required: false, example: "Negative" },
  { key: "vaccinations", label: "Vaccinations", required: false, example: "Hepatitis A, Hepatitis B" },
  { key: "other_vaccinations", label: "Other Vaccinations", required: false, example: "" },
  { key: "joint_deformity", label: "Joint Deformity", required: false, example: "Mild" },
  { key: "activity_level", label: "Activity Level", required: false, example: "Moderate" },
  { key: "filled_by", label: "Form Filled By (Operator)", required: false, example: "Dr. Hammad" },
  { key: "designation", label: "Operator Designation", required: false, example: "Clinician" },
  { key: "organization", label: "Operator Organization", required: false, example: "PHPWS" },
  { key: "comments", label: "Clinical Notes / Comments", required: false, example: "Active registry profile" },
  { key: "record_date", label: "Registration Date (YYYY-MM-DD)", required: false, example: "2026-10-31" },
];

export const TREATMENT_COLUMNS: ColumnDefinition[] = [
  { key: "patient_id", label: "Patient ID / H-#", required: true, example: 1 },
  { key: "patient_name", label: "Patient Name (Ref)", required: false, example: "Muhammad Ali" },
  { key: "injection_id", label: "Injection Product ID", required: true, example: 1 },
  { key: "injection_name", label: "Injection Product Name", required: false, example: "Factor VIII (Recombinant)" },
  { key: "treatment_date", label: "Treatment Date (YYYY-MM-DD)", required: true, example: "2026-10-30" },
  { key: "reason", label: "Clinical Reason / Indication", required: true, example: "Joint bleed" },
  { key: "dose_iu", label: "Dose (IU)", required: true, example: 1000 },
  { key: "medication", label: "Co-Medication", required: false, example: "Paracetamol" },
  { key: "comments", label: "Clinical Notes", required: false, example: "Right knee hemarthrosis" },
];

export const INJECTION_COLUMNS: ColumnDefinition[] = [
  { key: "name", label: "Product Name", required: true, example: "Factor VIII (Recombinant)" },
  { key: "type", label: "Therapeutic Class / Type", required: false, example: "Factor VIII" },
  { key: "strength", label: "Available Strength", required: false, example: "250/500/1000 IU" },
  { key: "is_active", label: "Active Status (true/false)", required: false, example: true },
];

export const USER_COLUMNS: ColumnDefinition[] = [
  { key: "email", label: "Work Email", required: true, example: "doctor@umeed.org" },
  { key: "full_name", label: "Full Name", required: true, example: "Dr. Hammad Tariq" },
  { key: "role", label: "Role (super_admin/admin/manager/clinician)", required: true, example: "clinician" },
  { key: "status", label: "Status (active/inactive/suspended/pending)", required: false, example: "active" },
  { key: "phone", label: "Phone", required: false, example: "0321-9876543" },
  { key: "department", label: "Department / Clinic", required: false, example: "Hematology / HTC" },
];

// Helper: Formula injection sanitizer
export function sanitizeCellValue(val: any): any {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "number" || typeof val === "boolean") return val;
  const str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}

/**
 * Detect file format automatically (.xlsx / .xls vs .csv)
 */
export function detectFormat(file: File): SupportedFormat {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "xlsx";
  if (name.endsWith(".csv") || name.endsWith(".txt")) return "csv";

  // Check MIME type
  if (
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel"
  ) {
    return "xlsx";
  }
  return "csv";
}

/**
 * Automatically detects whether file is Excel or CSV, then parses rows and headers
 */
export async function detectAndParseFile(file: File): Promise<ParsedDataResult> {
  const format = detectFormat(file);

  if (format === "xlsx") {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error("Excel workbook contains no sheets.");
    }

    const headers: string[] = [];
    const rows: Record<string, any>[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as any[];
      // ExcelJS values are 1-indexed (index 0 is undefined or empty)
      const cleanValues = values.slice(1);

      if (rowNumber === 1) {
        cleanValues.forEach((cell) => {
          headers.push(cell ? String(cell).trim() : "");
        });
      } else {
        const rowObj: Record<string, any> = {};
        let hasData = false;
        headers.forEach((h, colIdx) => {
          if (!h) return;
          const rawVal = cleanValues[colIdx];
          let cellVal = rawVal;
          if (rawVal && typeof rawVal === "object" && "result" in rawVal) {
            cellVal = rawVal.result; // formula result
          } else if (rawVal && typeof rawVal === "object" && "text" in rawVal) {
            cellVal = rawVal.text; // rich text or link
          }
          if (cellVal !== undefined && cellVal !== null && cellVal !== "") {
            hasData = true;
          }
          rowObj[h] = cellVal ?? "";
        });
        if (hasData) {
          rows.push(rowObj);
        }
      }
    });

    return {
      format: "xlsx",
      headers,
      rows,
      totalRows: rows.length,
    };
  } else {
    // Parse CSV
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: "greedy",
        dynamicTyping: true,
        complete: (results) => {
          const headers = (results.meta.fields || []).map((h) => h.trim());
          const rows = (results.data as Record<string, any>[]).filter((row) =>
            Object.values(row).some((v) => v !== null && v !== undefined && String(v).trim() !== "")
          );
          resolve({
            format: "csv",
            headers,
            rows,
            totalRows: rows.length,
          });
        },
        error: (err) => {
          reject(new Error(err.message || "Failed to parse CSV file"));
        },
      });
    });
  }
}

/**
 * Universal export to Excel (.xlsx) or CSV (.csv)
 */
export async function exportToExcelOrCsv({
  filename,
  format,
  columns,
  data,
  sheetName = "Registry Data",
}: {
  filename: string;
  format: SupportedFormat;
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
  sheetName?: string;
}) {
  const baseName = filename.replace(/\.(csv|xlsx)$/i, "");
  const fullFileName = `${baseName}.${format}`;

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "UMEED Clinical Registry";
    workbook.lastModifiedBy = "UMEED Clinical System";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // Setup headers
    worksheet.columns = columns.map((col) => ({
      header: col.label,
      key: col.key,
      width: Math.max(col.label.length + 4, 16),
    }));

    // Header styling: UMEED gold/burgundy aesthetic
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FF190617" }, size: 10 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEAAA00" }, // UMEED Amber Gold
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    // Populate data
    data.forEach((item) => {
      const rowValues: Record<string, any> = {};
      columns.forEach((col) => {
        rowValues[col.key] = sanitizeCellValue(item[col.key]);
      });
      const row = worksheet.addRow(rowValues);
      row.alignment = { vertical: "middle" };
    });

    // Generate buffer & download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    triggerDownloadBlob(blob, fullFileName);
  } else {
    // CSV output
    const headers = columns.map((c) => sanitizeCellValue(c.label));
    const csvRows = [headers.join(",")];

    data.forEach((item) => {
      const rowVals = columns.map((col) => {
        const val = sanitizeCellValue(item[col.key]);
        const str = String(val ?? "").replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(rowVals.join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\r\n"); // UTF-8 BOM
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerDownloadBlob(blob, fullFileName);
  }
}

/**
 * Generate and download a sample template (.xlsx or .csv) for easy bulk upload
 */
export async function downloadSampleTemplate(
  entityType: "patients" | "treatments" | "injections" | "users",
  format: SupportedFormat
) {
  let columns: ColumnDefinition[] = [];
  let title = "Sample_Template";

  switch (entityType) {
    case "patients":
      columns = PATIENT_COLUMNS;
      title = "UMEED_Patients_Bulk_Template";
      break;
    case "treatments":
      columns = TREATMENT_COLUMNS;
      title = "UMEED_Treatments_Bulk_Template";
      break;
    case "injections":
      columns = INJECTION_COLUMNS;
      title = "UMEED_Injections_Bulk_Template";
      break;
    case "users":
      columns = USER_COLUMNS;
      title = "UMEED_Users_Bulk_Template";
      break;
  }

  // Create sample record from examples
  const sampleData: Record<string, any> = {};
  columns.forEach((c) => {
    sampleData[c.key] = c.example ?? "";
  });

  await exportToExcelOrCsv({
    filename: title,
    format,
    columns,
    data: [sampleData],
    sheetName: `${entityType.toUpperCase()} Template`,
  });
}

function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
