import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  PatientRecord,
  TreatmentRecord,
  InjectionItem,
  HistoryRecord,
  INITIAL_INJECTIONS,
} from "@/data/mockData";
import { OfflineQueueItem } from "@/lib/offlineQueue";
import {
  formatCNIC,
  formatPakistanPhone,
  normalizeTestResult,
} from "@/lib/pakistanValidation";

export interface DataServiceStatus {
  isLiveDb: boolean;
  dbHost: string | null;
  loading: boolean;
  error?: string | null;
}

export interface DbUserRecord {
  id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "manager" | "clinician";
  status: "active" | "inactive" | "suspended" | "pending";
  password_hash?: string;
  phone?: string;
  department?: string;
  last_login?: string;
  created_at?: string;
}

/**
 * Normalise Supabase row to PatientRecord interface
 */
export function mapRowToPatient(row: any): PatientRecord {
  const dob = row.date_of_birth || "";
  const calculatedAge =
    row.age !== undefined && row.age !== null
      ? Number(row.age)
      : dob
        ? Math.max(0, new Date().getFullYear() - parseInt(dob.slice(0, 4), 10))
        : 25;

  let calculatedSeverity: "Severe" | "Moderate" | "Mild" = "Moderate";
  const factor = Number(row.baseline_factor_activity);
  if (!isNaN(factor)) {
    if (factor < 1) calculatedSeverity = "Severe";
    else if (factor <= 5) calculatedSeverity = "Moderate";
    else calculatedSeverity = "Mild";
  }

  return {
    patient_id: Number(row.patient_id),
    registration_no: row.registration_no || `H-${row.patient_id}`,
    patient_name: row.patient_name || "Unknown Patient",
    date_of_birth: dob,
    age: calculatedAge,
    gender: row.gender || "Male",
    marital_status: row.marital_status || "Single",
    cnic: row.cnic || "",
    blood_group: row.blood_group || "O+",
    record_date: row.record_date || new Date().toISOString().slice(0, 10),
    qualification: row.qualification || "",
    profession: row.profession || "",
    job_title: row.job_title || "",
    address: row.address || "",
    city: row.city || row.city_town || "",
    city_town: row.city_town || row.city || "",
    province: row.province || "Punjab",
    telephone: row.telephone || "",
    emergency_number: row.emergency_number || "",
    email: row.email || "",
    guardian_name: row.guardian_name || "",
    guardian_cnic: row.guardian_cnic || "",
    household_other_bleeder: row.household_other_bleeder ?? false,
    household_patient_name: row.household_patient_name || "",
    household_relation: row.household_relation || "",
    diagnosis: row.diagnosis || "Hemophilia A",
    registered_with_chapter: row.registered_with_chapter ?? false,
    chapter_name: row.chapter_name || "",
    diagnostic_technique: row.diagnostic_technique || "Factor assay",
    diagnostic_other: row.diagnostic_other || "",
    baseline_factor_activity: factor || 1.0,
    diagnostic_reason: row.diagnostic_reason || "Bleeding symptoms",
    diagnostic_reason_other: row.diagnostic_reason_other || "",
    age_first_diagnosed: row.age_first_diagnosed != null ? Number(row.age_first_diagnosed) : null,
    severity: (row.severity as any) || calculatedSeverity,
    treatment_type: row.treatment_type || "On-demand",
    inhibitor_status: row.inhibitor_status || "Negative",
    bleeding_episodes_12m: Number(row.bleeding_episodes_12m) || 0,
    treatment_products: row.treatment_products || "",
    hcv: row.hcv || "Negative",
    hiv: row.hiv || "Negative",
    hbv: row.hbv || "Negative",
    vaccinations: Array.isArray(row.vaccinations)
      ? row.vaccinations
      : typeof row.vaccinations === "string"
        ? row.vaccinations.split(",").map((s: string) => s.trim())
        : [],
    other_vaccinations: row.other_vaccinations || "",
    joint_deformity: row.joint_deformity || "None",
    activity_level: row.activity_level || "Moderate",
    filled_by: row.filled_by || "",
    designation: row.designation || "",
    organization: row.organization || "",
    comments: row.comments || "",
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
    status: "active",
  };
}

/**
 * Normalise Supabase treatment row
 */
export function mapRowToTreatment(row: any): TreatmentRecord {
  return {
    id: Number(row.id),
    patient_id: Number(row.patient_id),
    registration_no: row.patients?.registration_no || `H-${row.patient_id}`,
    patient_name: row.patients?.patient_name || "Patient",
    injection_id: Number(row.injection_id),
    injection_name: row.injections?.name || "Factor Product",
    treatment_date: row.treatment_date || new Date().toISOString().slice(0, 10),
    reason: row.reason || "Infusion",
    medication: row.medication || "",
    dose_iu: Number(row.dose_iu) || 0,
    comments: row.comments || "",
  };
}

/**
 * Fetch all patients from Supabase. No dummy data.
 */
export async function getPatients(isLive: boolean): Promise<PatientRecord[]> {
  if (!isLive || !isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("patients_view")
      .select("*")
      .order("patient_id", { ascending: false });

    if (error) {
      const { data: tableData, error: tableErr } = await supabase
        .from("patients")
        .select("*")
        .order("patient_id", { ascending: false });
      if (tableErr) return [];
      return (tableData || []).map(mapRowToPatient);
    }
    return (data || []).map(mapRowToPatient);
  } catch (err) {
    console.warn("Could not query patients:", err);
    return [];
  }
}

/**
 * Fetch all treatments from Supabase. No dummy data.
 */
export async function getTreatments(
  isLive: boolean,
): Promise<TreatmentRecord[]> {
  if (!isLive || !isSupabaseConfigured) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("treatments")
      .select("*, patients(registration_no, patient_name), injections(name)")
      .order("treatment_date", { ascending: false });

    if (error) return [];
    return (data || []).map(mapRowToTreatment);
  } catch (err) {
    console.warn("Could not query treatments:", err);
    return [];
  }
}

/**
 * Fetch injections pharmaceutical catalog
 */
export async function getInjections(isLive: boolean): Promise<InjectionItem[]> {
  if (!isLive || !isSupabaseConfigured) {
    return INITIAL_INJECTIONS;
  }
  try {
    const { data, error } = await supabase
      .from("injections")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data || data.length === 0) return INITIAL_INJECTIONS;
    return data.map((d) => ({
      id: Number(d.id),
      name: d.name,
      type: d.type || "Factor",
      strength: d.strength || "",
      is_active: d.is_active ?? true,
    }));
  } catch {
    return INITIAL_INJECTIONS;
  }
}

/**
 * Fetch import/export audit history from Supabase.
 */
export async function getHistory(isLive: boolean): Promise<HistoryRecord[]> {
  if (!isLive || !isSupabaseConfigured) {
    return [];
  }
  try {
    const [impRes, expRes] = await Promise.all([
      supabase
        .from("import_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("export_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const records: HistoryRecord[] = [];
    if (impRes.data) {
      impRes.data.forEach((r) => {
        records.push({
          id: r.id,
          type: "import",
          filename: r.filename,
          format: r.format,
          records_count: r.records_count,
          success_count: r.success_count,
          failed_count: r.failed_count,
          status: r.status,
          timestamp: r.created_at?.slice(0, 16).replace("T", " ") || "",
          user: r.operator || "Operator",
        });
      });
    }
    if (expRes.data) {
      expRes.data.forEach((r) => {
        records.push({
          id: r.id,
          type: "export",
          filename: r.filename,
          format: r.format,
          records_count: r.records_count,
          success_count: r.records_count,
          failed_count: 0,
          status: r.status,
          timestamp: r.created_at?.slice(0, 16).replace("T", " ") || "",
          user: r.operator || "Operator",
        });
      });
    }

    return records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch {
    return [];
  }
}

/**
 * Fetch database users from public.users table
 */
export async function getUsersFromDb(isLive: boolean): Promise<DbUserRecord[]> {
  if (!isLive || !isSupabaseConfigured) {
    return [
      {
        id: "usr-admin-001",
        email: "admin@umeed.org",
        full_name: "Dr. Hammad (Lead Administrator)",
        role: "super_admin",
        status: "active",
        phone: "+92 300 1234567",
        department: "Executive Clinical Committee",
        created_at: new Date().toISOString(),
      },
      {
        id: "usr-clinician-002",
        email: "clinician@umeed.org",
        full_name: "Staff Clinician",
        role: "clinician",
        status: "active",
        phone: "+92 301 7654321",
        department: "Day Care Infusion Center",
        created_at: new Date().toISOString(),
      },
    ];
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, email, full_name, role, status, phone, department, last_login, created_at",
      )
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as DbUserRecord[];
  } catch (err) {
    console.warn("Could not query users:", err);
    return [];
  }
}

/**
 * Helper to build a clean Supabase patient payload with all database columns
 */
function buildPatientPayload(p: any, fallbackName = "Unnamed Patient") {
  const rawName =
    p.patient_name ||
    p["Patient Full Name"] ||
    p["Patient Name"] ||
    p["Full Name"] ||
    p["Name"] ||
    p["Full / Patient Name"] ||
    p["patient_name"];

  const patientName =
    rawName && String(rawName).trim() !== ""
      ? String(rawName).trim()
      : fallbackName;

  const rawCnic = p.cnic || p["CNIC"] || p["cnic"];
  const cnicVal =
    rawCnic && String(rawCnic).trim() !== ""
      ? formatCNIC(String(rawCnic).trim())
      : null;

  const rawGuardianCnic =
    p.guardian_cnic || p["Guardian CNIC"] || p["guardian_cnic"];
  const guardianCnicVal =
    rawGuardianCnic && String(rawGuardianCnic).trim() !== ""
      ? formatCNIC(String(rawGuardianCnic).trim())
      : null;

  const rawPhone = p.telephone || p["Telephone"] || p["Phone"] || p["telephone"];
  const phoneVal =
    rawPhone && String(rawPhone).trim() !== ""
      ? formatPakistanPhone(String(rawPhone).trim())
      : null;

  const rawEmerg =
    p.emergency_number || p["Emergency Phone"] || p["emergency_number"];
  const emergVal =
    rawEmerg && String(rawEmerg).trim() !== ""
      ? formatPakistanPhone(String(rawEmerg).trim())
      : null;

  const isHouseholdBleeder =
    p.household_other_bleeder === true ||
    p.household_other_bleeder === "yes" ||
    p.household_other_bleeder === "true";

  const isRegisteredChapter =
    p.registered_with_chapter === true ||
    p.registered_with_chapter === "yes" ||
    p.registered_with_chapter === "true";

  let vaccinationsArray: string[] | null = null;
  if (Array.isArray(p.vaccinations)) {
    vaccinationsArray = p.vaccinations;
  } else if (typeof p.vaccinations === "string" && p.vaccinations.trim() !== "") {
    vaccinationsArray = p.vaccinations
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  return {
    patient_name: patientName,
    date_of_birth: p.date_of_birth || null,
    gender: p.gender || "Male",
    marital_status: p.marital_status || "Single",
    cnic: cnicVal,
    blood_group: p.blood_group || "O+",
    record_date: p.record_date || new Date().toISOString().slice(0, 10),
    qualification: p.qualification || null,
    profession: p.profession || null,
    job_title: p.job_title || null,
    address: p.address || null,
    city: p.city || p.city_town || "Rawalpindi",
    city_town: p.city_town || p.city || null,
    province: p.province || "Punjab",
    telephone: phoneVal,
    emergency_number: emergVal,
    email: p.email || null,
    guardian_name: p.guardian_name || p["Guardian Name"] || null,
    guardian_cnic: guardianCnicVal,
    household_other_bleeder: isHouseholdBleeder,
    household_patient_name: p.household_patient_name || null,
    household_relation: p.household_relation || null,
    diagnosis: p.diagnosis || "Hemophilia A",
    registered_with_chapter: isRegisteredChapter,
    chapter_name: p.chapter_name || null,
    diagnostic_technique: p.diagnostic_technique || "Factor assay",
    diagnostic_other: p.diagnostic_other || null,
    baseline_factor_activity:
      p.baseline_factor_activity != null && p.baseline_factor_activity !== ""
        ? Number(p.baseline_factor_activity)
        : 1.0,
    diagnostic_reason: p.diagnostic_reason || "Bleeding symptoms",
    diagnostic_reason_other: p.diagnostic_reason_other || null,
    age_first_diagnosed:
      p.age_first_diagnosed != null && p.age_first_diagnosed !== ""
        ? Number(p.age_first_diagnosed)
        : null,
    treatment_type: p.treatment_type || "On-demand",
    inhibitor_status: p.inhibitor_status
      ? normalizeTestResult(p.inhibitor_status)
      : "Negative",
    bleeding_episodes_12m:
      p.bleeding_episodes_12m != null && p.bleeding_episodes_12m !== ""
        ? Number(p.bleeding_episodes_12m)
        : 0,
    treatment_products: p.treatment_products || null,
    hcv: normalizeTestResult(p.hcv),
    hiv: normalizeTestResult(p.hiv),
    hbv: normalizeTestResult(p.hbv),
    vaccinations: vaccinationsArray,
    other_vaccinations: p.other_vaccinations || null,
    joint_deformity: p.joint_deformity || "None",
    activity_level: p.activity_level || "Moderate",
    filled_by: p.filled_by || null,
    designation: p.designation || null,
    organization: p.organization || null,
    comments: p.comments || null,
  };
}

/**
 * Insert new patient into Supabase
 */
export async function createPatientInDb(
  p: PatientRecord,
  isLive: boolean,
): Promise<{ success: boolean; data?: PatientRecord; error?: string }> {
  if (!isLive || !isSupabaseConfigured) {
    return { success: true, data: p };
  }

  try {
    const payload = buildPatientPayload(p, "Unnamed Patient");

    const { data, error } = await supabase
      .from("patients")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return { success: true, data: mapRowToPatient(data) };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to save to database",
    };
  }
}

/**
 * Update existing patient in Supabase
 */
export async function updatePatientInDb(
  p: PatientRecord,
  isLive: boolean,
): Promise<{ success: boolean; data?: PatientRecord; error?: string }> {
  if (!isLive || !isSupabaseConfigured) {
    return { success: true, data: p };
  }

  try {
    const payload = {
      ...buildPatientPayload(p, p.patient_name || "Updated Patient"),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("patients")
      .update(payload)
      .eq("patient_id", p.patient_id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: mapRowToPatient(data) };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to update patient in database",
    };
  }
}

/**
 * Bulk Insert Patients into Database
 */
export async function bulkCreatePatientsInDb(
  patients: Partial<PatientRecord>[],
  isLive: boolean,
): Promise<{
  success: boolean;
  count: number;
  data?: PatientRecord[];
  error?: string;
}> {
  // Filter out blank rows
  const validPatients = (patients || []).filter((p: any) => {
    if (!p) return false;
    const name =
      p.patient_name ||
      p["Patient Full Name"] ||
      p["Patient Name"] ||
      p["Full Name"] ||
      p["Name"] ||
      p["Full / Patient Name"];
    const cnic = p.cnic || p["CNIC"] || p["cnic"];
    const phone = p.telephone || p["Telephone"] || p["Phone"] || p["telephone"];
    return Boolean(
      (name && String(name).trim() !== "") ||
      (cnic && String(cnic).trim() !== "") ||
      (phone && String(phone).trim() !== ""),
    );
  });

  if (validPatients.length === 0) {
    return {
      success: false,
      count: 0,
      error: "No valid patient rows found to import.",
    };
  }

  if (!isLive || !isSupabaseConfigured) {
    const fallback = validPatients.map((p, idx) => ({
      ...p,
      patient_id: p.patient_id || Date.now() + idx,
      registration_no: p.registration_no || `H-${Date.now() + idx}`,
      patient_name:
        p.patient_name || (p as any)["Patient Full Name"] || `Patient ${idx + 1}`,
      date_of_birth: p.date_of_birth || "2000-01-01",
      age: p.age || 25,
      gender: p.gender || "Male",
      marital_status: p.marital_status || "Single",
      cnic: p.cnic || "",
      blood_group: p.blood_group || "O+",
      record_date: p.record_date || new Date().toISOString().slice(0, 10),
      city: p.city || "Rawalpindi",
      province: p.province || "Punjab",
      telephone: p.telephone || "",
      diagnosis: p.diagnosis || "Hemophilia A",
      severity: p.severity || "Moderate",
      baseline_factor_activity: p.baseline_factor_activity || 1.0,
      treatment_type: p.treatment_type || "On-demand",
      inhibitor_status: p.inhibitor_status || "Negative",
      bleeding_episodes_12m: p.bleeding_episodes_12m || 0,
      treatment_products: p.treatment_products || "",
      hcv: p.hcv || "Negative",
      hiv: p.hiv || "Negative",
      hbv: p.hbv || "Negative",
      status: "active" as const,
    })) as PatientRecord[];
    return { success: true, count: fallback.length, data: fallback };
  }

  try {
    const payloads = validPatients.map((p, idx) =>
      buildPatientPayload(p, `Imported Patient ${idx + 1}`),
    );

    const { data, error } = await supabase
      .from("patients")
      .insert(payloads)
      .select();
    if (error) throw error;
    const mapped = (data || []).map(mapRowToPatient);
    return { success: true, count: mapped.length, data: mapped };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: err.message || "Bulk patient insert failed",
    };
  }
}

/**
 * Bulk Insert Treatments into Database
 */
export async function bulkCreateTreatmentsInDb(
  treatments: Partial<TreatmentRecord>[],
  isLive: boolean,
): Promise<{
  success: boolean;
  count: number;
  data?: TreatmentRecord[];
  error?: string;
}> {
  if (!isLive || !isSupabaseConfigured) {
    const fallback = treatments.map((t, i) => ({
      ...t,
      id: t.id || Date.now() + i,
      patient_id: t.patient_id || 1,
      registration_no: t.registration_no || `H-${t.patient_id || 1}`,
      patient_name: t.patient_name || "Patient",
      injection_id: t.injection_id || 1,
      injection_name: t.injection_name || "Factor VIII",
      treatment_date: t.treatment_date || new Date().toISOString().slice(0, 10),
      reason: t.reason || "Infusion",
      medication: t.medication || "",
      dose_iu: t.dose_iu ? Number(t.dose_iu) : 500,
      comments: t.comments || "",
    })) as TreatmentRecord[];
    return { success: true, count: fallback.length, data: fallback };
  }

  try {
    const payloads = treatments.map((t) => ({
      patient_id: Number(t.patient_id),
      injection_id: Number(t.injection_id),
      treatment_date: t.treatment_date || new Date().toISOString().slice(0, 10),
      reason: t.reason || "Infusion",
      medication: t.medication || null,
      dose_iu: t.dose_iu ? Number(t.dose_iu) : 0,
      comments: t.comments || null,
    }));

    const { data, error } = await supabase
      .from("treatments")
      .insert(payloads)
      .select("*, patients(registration_no, patient_name), injections(name)");

    if (error) throw error;
    const mapped = (data || []).map(mapRowToTreatment);
    return { success: true, count: mapped.length, data: mapped };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: err.message || "Bulk treatment insert failed",
    };
  }
}

/**
 * Bulk Insert Injections into Database
 */
export async function bulkCreateInjectionsInDb(
  injections: Partial<InjectionItem>[],
  isLive: boolean,
): Promise<{
  success: boolean;
  count: number;
  data?: InjectionItem[];
  error?: string;
}> {
  if (!isLive || !isSupabaseConfigured) {
    const fallback = injections.map((item, idx) => ({
      id: item.id || Date.now() + idx,
      name: item.name || `Product ${idx + 1}`,
      type: item.type || "Factor",
      strength: item.strength || "500 IU",
      is_active: item.is_active ?? true,
    }));
    return { success: true, count: fallback.length, data: fallback };
  }

  try {
    const payloads = injections.map((i) => ({
      name: i.name!,
      type: i.type || "Factor",
      strength: i.strength || "",
      is_active: i.is_active ?? true,
    }));

    const { data, error } = await supabase
      .from("injections")
      .upsert(payloads, { onConflict: "name" })
      .select();

    if (error) throw error;
    const mapped = (data || []).map((d) => ({
      id: Number(d.id),
      name: d.name,
      type: d.type || "Factor",
      strength: d.strength || "",
      is_active: d.is_active ?? true,
    }));
    return { success: true, count: mapped.length, data: mapped };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: err.message || "Bulk injections insert failed",
    };
  }
}

/**
 * Bulk Insert Users into Database
 */
export async function bulkCreateUsersInDb(
  users: Partial<DbUserRecord>[],
  isLive: boolean,
): Promise<{
  success: boolean;
  count: number;
  data?: DbUserRecord[];
  error?: string;
}> {
  if (!isLive || !isSupabaseConfigured) {
    const fallback = users.map((u, i) => ({
      id: u.id || `usr-bulk-${Date.now()}-${i}`,
      email: u.email!,
      full_name: u.full_name || "Clinical User",
      role: u.role || "clinician",
      status: u.status || "active",
      phone: u.phone || "",
      department: u.department || "Clinical Unit",
      created_at: new Date().toISOString(),
    })) as DbUserRecord[];
    return { success: true, count: fallback.length, data: fallback };
  }

  try {
    const payloads = users.map((u) => ({
      email: u.email!.trim().toLowerCase(),
      full_name: u.full_name || "Clinical User",
      role: u.role || "clinician",
      status: u.status || "active",
      phone: u.phone || null,
      department: u.department || null,
      password_hash: u.password_hash || "Argon2id$default_preauthorized",
      email_verified: true,
    }));

    const { data, error } = await supabase
      .from("users")
      .upsert(payloads, { onConflict: "email" })
      .select(
        "id, email, full_name, role, status, phone, department, created_at",
      );

    if (error) throw error;
    return {
      success: true,
      count: (data || []).length,
      data: data as DbUserRecord[],
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: err.message || "Bulk user insert failed",
    };
  }
}

/**
 * Record a login attempt into login_attempts table
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress = "127.0.0.1",
  userAgent?: string,
) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from("login_attempts").insert([
      {
        email: email.trim().toLowerCase(),
        ip_address: ipAddress,
        success,
        user_agent:
          userAgent ||
          (typeof navigator !== "undefined" ? navigator.userAgent : null),
      },
    ]);
  } catch (err) {
    console.warn("Could not record login attempt:", err);
  }
}

/**
 * Record an audit log entry into audit_logs table
 */
export async function recordAuditLog(payload: {
  user_id?: string;
  user_email?: string;
  action: string;
  resource: string;
  status: "success" | "warning" | "blocked" | "failure";
  ip_address?: string;
  user_agent?: string;
  details?: string;
}) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from("audit_logs").insert([
      {
        user_id: payload.user_id || null,
        user_email: payload.user_email || null,
        action: payload.action,
        resource: payload.resource,
        status: payload.status,
        ip_address: payload.ip_address || "127.0.0.1",
        user_agent:
          payload.user_agent ||
          (typeof navigator !== "undefined" ? navigator.userAgent : null),
        details: payload.details || null,
      },
    ]);
  } catch (err) {
    console.warn("Could not record audit log:", err);
  }
}

/**
 * Record an import operation into import_history table
 */
export async function recordImportHistory(item: {
  id: string;
  filename: string;
  format: "csv" | "xlsx";
  records_count: number;
  success_count: number;
  failed_count: number;
  status: "Completed" | "Partial" | "Failed";
  operator: string;
}) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from("import_history").insert([item]);
  } catch (err) {
    console.warn("Could not save import history to database:", err);
  }
}

/**
 * Record an export operation into export_history table
 */
export async function recordExportHistory(item: {
  id: string;
  filename: string;
  format: "csv" | "xlsx";
  records_count: number;
  status: string;
  operator: string;
}) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from("export_history").insert([item]);
  } catch (err) {
    console.warn("Could not save export history to database:", err);
  }
}

/**
 * Delete patient from Supabase
 */
export async function deletePatientFromDb(
  patientId: number,
  isLive: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!isLive || !isSupabaseConfigured) {
    return { success: true };
  }
  try {
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("patient_id", patientId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Insert new treatment into Supabase
 */
export async function createTreatmentInDb(
  t: TreatmentRecord,
  isLive: boolean,
): Promise<{ success: boolean; data?: TreatmentRecord; error?: string }> {
  if (!isLive || !isSupabaseConfigured) {
    return { success: true, data: t };
  }
  try {
    const payload = {
      patient_id: t.patient_id,
      injection_id: t.injection_id,
      treatment_date: t.treatment_date,
      reason: t.reason,
      medication: t.medication,
      dose_iu: t.dose_iu,
      comments: t.comments,
    };
    const { data, error } = await supabase
      .from("treatments")
      .insert([payload])
      .select("*, patients(registration_no, patient_name), injections(name)")
      .single();
    if (error) throw error;
    return { success: true, data: mapRowToTreatment(data) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sync an offline queued item to the database
 */
export async function syncOfflineQueueItem(
  item: OfflineQueueItem,
  isLive: boolean,
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    let result: { success: boolean; error?: string; count?: number } = {
      success: false,
    };

    switch (item.entityType) {
      case "patients":
        result = await bulkCreatePatientsInDb(item.rows as any, isLive);
        break;
      case "treatments":
        result = await bulkCreateTreatmentsInDb(item.rows as any, isLive);
        break;
      case "injections":
        result = await bulkCreateInjectionsInDb(item.rows as any, isLive);
        break;
      case "users":
        result = await bulkCreateUsersInDb(item.rows as any, isLive);
        break;
    }

    if (result.success) {
      await recordImportHistory({
        id: item.id,
        filename: item.filename,
        format: item.format,
        records_count: item.recordCount,
        success_count: result.count || item.recordCount,
        failed_count: 0,
        status: "Completed",
        operator: "Offline Auto-Sync",
      });
    }

    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to sync offline item",
    };
  }
}
