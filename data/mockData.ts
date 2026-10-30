// Realistic dataset for Hemophilia Registry & Befal Neumorphic App
export interface PatientRecord {
  patient_id: number;
  registration_no: string;
  patient_name: string;
  date_of_birth: string;
  age: number;
  gender: string;
  marital_status: string;
  cnic: string;
  blood_group: string;
  record_date: string;
  qualification: string;
  profession: string;
  job_title: string;
  address: string;
  city: string;
  province: string;
  telephone: string;
  email: string;
  guardian_name: string;
  guardian_cnic?: string;
  diagnosis: string;
  severity: "Severe" | "Moderate" | "Mild";
  baseline_factor_activity: number;
  treatment_type: "On-demand" | "Prophylaxis" | "None";
  inhibitor_status: "Positive" | "Negative" | "Unknown";
  bleeding_episodes_12m: number;
  treatment_products: string;
  hcv: "Positive" | "Negative" | "Not tested";
  hiv: "Positive" | "Negative" | "Not tested";
  hbv: "Positive" | "Negative" | "Not tested";
  status: "active" | "inactive";
}

export interface TreatmentRecord {
  id: number;
  patient_id: number;
  registration_no: string;
  patient_name: string;
  injection_id: number;
  injection_name: string;
  treatment_date: string;
  reason: string;
  medication: string;
  dose_iu: number;
  comments: string;
}

export interface InjectionItem {
  id: number;
  name: string;
  type: string;
  strength: string;
  is_active: boolean;
}

export interface AuditRecord {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  status: "success" | "warning" | "blocked";
  ip: string;
  details: string;
}

export interface HistoryRecord {
  id: string;
  type: "import" | "export";
  filename: string;
  format: "csv" | "xlsx";
  records_count: number;
  success_count: number;
  failed_count: number;
  status: "Completed" | "Partial" | "Failed";
  timestamp: string;
  user: string;
}

export const INITIAL_PATIENTS: PatientRecord[] = [
  {
    patient_id: 1,
    registration_no: "H-101",
    patient_name: "Muhammad Hamza",
    date_of_birth: "2004-05-12",
    age: 22,
    gender: "Male",
    marital_status: "Single",
    cnic: "35201-7894561-3",
    blood_group: "O+",
    record_date: "2024-01-15",
    qualification: "Undergraduate",
    profession: "Student",
    job_title: "CS Student",
    address: "Model Town Block B",
    city: "Lahore",
    province: "Punjab",
    telephone: "+92 300 1234567",
    email: "hamza@example.com",
    guardian_name: "Rashid Ali",
    diagnosis: "Hemophilia A",
    severity: "Severe",
    baseline_factor_activity: 0.8,
    treatment_type: "Prophylaxis",
    inhibitor_status: "Negative",
    bleeding_episodes_12m: 3,
    treatment_products: "Factor VIII (Recombinant)",
    hcv: "Negative",
    hiv: "Negative",
    hbv: "Negative",
    status: "active",
  },
  {
    patient_id: 2,
    registration_no: "H-102",
    patient_name: "Zainab Bibi",
    date_of_birth: "2010-09-24",
    age: 16,
    gender: "Female",
    marital_status: "Single",
    cnic: "37405-2349012-4",
    blood_group: "A+",
    record_date: "2024-02-10",
    qualification: "Matric",
    profession: "Student",
    job_title: "Student",
    address: "Satellite Town",
    city: "Rawalpindi",
    province: "Punjab",
    telephone: "+92 333 9876543",
    email: "zainab.b@example.com",
    guardian_name: "Tariq Mahmood",
    diagnosis: "von Willebrand disease",
    severity: "Moderate",
    baseline_factor_activity: 4.2,
    treatment_type: "On-demand",
    inhibitor_status: "Negative",
    bleeding_episodes_12m: 6,
    treatment_products: "Desmopressin (DDAVP)",
    hcv: "Negative",
    hiv: "Negative",
    hbv: "Negative",
    status: "active",
  },
  {
    patient_id: 3,
    registration_no: "H-103",
    patient_name: "Bilal Ahmed Khan",
    date_of_birth: "1998-11-03",
    age: 27,
    gender: "Male",
    marital_status: "Married",
    cnic: "42101-5678912-1",
    blood_group: "B+",
    record_date: "2024-03-01",
    qualification: "Masters",
    profession: "Accountant",
    job_title: "Finance Officer",
    address: "Gulshan-e-Iqbal Block 4",
    city: "Karachi",
    province: "Sindh",
    telephone: "+92 321 4567890",
    email: "bilal.khan@example.com",
    guardian_name: "Ahmed Khan",
    diagnosis: "Hemophilia B",
    severity: "Severe",
    baseline_factor_activity: 0.5,
    treatment_type: "Prophylaxis",
    inhibitor_status: "Positive",
    bleeding_episodes_12m: 8,
    treatment_products: "Factor IX",
    hcv: "Positive",
    hiv: "Negative",
    hbv: "Negative",
    status: "active",
  },
  {
    patient_id: 4,
    registration_no: "H-104",
    patient_name: "Ahmad Raza",
    date_of_birth: "2018-03-15",
    age: 8,
    gender: "Male",
    marital_status: "Single",
    cnic: "17301-3456789-5",
    blood_group: "AB+",
    record_date: "2024-04-18",
    qualification: "Primary",
    profession: "Child",
    job_title: "Child",
    address: "Hayatabad Phase 2",
    city: "Peshawar",
    province: "KPK",
    telephone: "+92 345 8765432",
    email: "guard.raza@example.com",
    guardian_name: "Farooq Raza",
    diagnosis: "Hemophilia A",
    severity: "Moderate",
    baseline_factor_activity: 3.5,
    treatment_type: "On-demand",
    inhibitor_status: "Negative",
    bleeding_episodes_12m: 4,
    treatment_products: "Factor VIII (Plasma-derived)",
    hcv: "Negative",
    hiv: "Negative",
    hbv: "Negative",
    status: "active",
  },
  {
    patient_id: 5,
    registration_no: "H-105",
    patient_name: "Fatima Noor",
    date_of_birth: "2000-08-19",
    age: 26,
    gender: "Female",
    marital_status: "Single",
    cnic: "54400-8901234-2",
    blood_group: "O-",
    record_date: "2024-05-22",
    qualification: "Bachelors",
    profession: "Teacher",
    job_title: "Primary Teacher",
    address: "Jinnah Town",
    city: "Quetta",
    province: "Balochistan",
    telephone: "+92 312 3456789",
    email: "fatima.noor@example.com",
    guardian_name: "Ghulam Nabi",
    diagnosis: "Factor VII deficiency",
    severity: "Mild",
    baseline_factor_activity: 12.0,
    treatment_type: "On-demand",
    inhibitor_status: "Negative",
    bleeding_episodes_12m: 1,
    treatment_products: "NovoSeven (rFVIIa)",
    hcv: "Negative",
    hiv: "Negative",
    hbv: "Negative",
    status: "active",
  },
  {
    patient_id: 6,
    registration_no: "H-106",
    patient_name: "Usman Ghani",
    date_of_birth: "1992-02-14",
    age: 34,
    gender: "Male",
    marital_status: "Married",
    cnic: "61101-1237890-7",
    blood_group: "A-",
    record_date: "2024-06-05",
    qualification: "FSc",
    profession: "Business",
    job_title: "Shopkeeper",
    address: "Sector F-10",
    city: "Islamabad",
    province: "Islamabad",
    telephone: "+92 301 9876543",
    email: "usman.ghani@example.com",
    guardian_name: "Haji Abdul Rehman",
    diagnosis: "Hemophilia A",
    severity: "Severe",
    baseline_factor_activity: 0.6,
    treatment_type: "Prophylaxis",
    inhibitor_status: "Negative",
    bleeding_episodes_12m: 2,
    treatment_products: "Emicizumab (Hemlibra)",
    hcv: "Negative",
    hiv: "Negative",
    hbv: "Negative",
    status: "active",
  },
];

export const INITIAL_INJECTIONS: InjectionItem[] = [
  { id: 1, name: "Factor VIII (Recombinant)", type: "Factor VIII", strength: "250/500/1000 IU", is_active: true },
  { id: 2, name: "Factor VIII (Plasma-derived)", type: "Factor VIII", strength: "250/500/1000 IU", is_active: true },
  { id: 3, name: "Factor IX", type: "Factor IX", strength: "500/1000 IU", is_active: true },
  { id: 4, name: "FEIBA", type: "Bypassing agent", strength: "500/1000 U", is_active: true },
  { id: 5, name: "NovoSeven (rFVIIa)", type: "Bypassing agent", strength: "1/2/5 mg", is_active: true },
  { id: 6, name: "Emicizumab (Hemlibra)", type: "Non-factor", strength: "30/60/150 mg", is_active: true },
  { id: 7, name: "Desmopressin (DDAVP)", type: "Other", strength: "4 mcg/ml", is_active: true },
  { id: 8, name: "Tranexamic acid", type: "Other", strength: "500 mg/5 ml", is_active: true },
  { id: 9, name: "Cryoprecipitate", type: "Blood product", strength: "Bag", is_active: true },
  { id: 10, name: "Fresh frozen plasma", type: "Blood product", strength: "Unit", is_active: true },
];

export const INITIAL_TREATMENTS: TreatmentRecord[] = [
  {
    id: 1,
    patient_id: 1,
    registration_no: "H-101",
    patient_name: "Muhammad Hamza",
    injection_id: 1,
    injection_name: "Factor VIII (Recombinant)",
    treatment_date: "2024-10-25",
    reason: "Joint bleed",
    medication: "Paracetamol",
    dose_iu: 1000,
    comments: "Right knee hemarthrosis. Resolved post infusion.",
  },
  {
    id: 2,
    patient_id: 3,
    registration_no: "H-103",
    patient_name: "Bilal Ahmed Khan",
    injection_id: 3,
    injection_name: "Factor IX",
    treatment_date: "2024-10-22",
    reason: "Prophylaxis",
    medication: "None",
    dose_iu: 1500,
    comments: "Weekly scheduled prophylaxis dose.",
  },
  {
    id: 3,
    patient_id: 4,
    registration_no: "H-104",
    patient_name: "Ahmad Raza",
    injection_id: 2,
    injection_name: "Factor VIII (Plasma-derived)",
    treatment_date: "2024-10-18",
    reason: "Trauma",
    medication: "Tranexamic acid",
    dose_iu: 500,
    comments: "Fall while playing. Minor lip laceration.",
  },
  {
    id: 4,
    patient_id: 2,
    registration_no: "H-102",
    patient_name: "Zainab Bibi",
    injection_id: 7,
    injection_name: "Desmopressin (DDAVP)",
    treatment_date: "2024-10-12",
    reason: "Mucosal bleed (nose / mouth / gum)",
    medication: "Nasal pack",
    dose_iu: 250,
    comments: "Epistaxis lasted 45 minutes before factor administration.",
  },
  {
    id: 5,
    patient_id: 6,
    registration_no: "H-106",
    patient_name: "Usman Ghani",
    injection_id: 6,
    injection_name: "Emicizumab (Hemlibra)",
    treatment_date: "2024-10-05",
    reason: "Prophylaxis",
    medication: "None",
    dose_iu: 60,
    comments: "Subcutaneous maintenance injection.",
  },
];

export const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  { id: 101, timestamp: "2024-10-30 14:45:12", user: "admin@befal.org", action: "USER_LOGIN", resource: "Auth", status: "success", ip: "192.168.1.45", details: "Successful session creation via Argon2id authentication" },
  { id: 102, timestamp: "2024-10-30 14:12:05", user: "system_security", action: "RATE_LIMIT_CHECK", resource: "API /auth/login", status: "success", ip: "103.255.4.12", details: "Brute-force protection: 1 attempt within safe threshold" },
  { id: 103, timestamp: "2024-10-30 13:30:20", user: "clinician@befal.org", action: "PATIENT_CREATED", resource: "Patient #H-106", status: "success", ip: "192.168.1.88", details: "Registered patient Usman Ghani with baseline Factor VIII" },
  { id: 104, timestamp: "2024-10-30 11:15:44", user: "admin@befal.org", action: "IMPORT_COMPLETED", resource: "Imports", status: "success", ip: "192.168.1.45", details: "Batch import: 42 records processed, 0 errors" },
  { id: 105, timestamp: "2024-10-30 09:20:11", user: "unknown", action: "LOGIN_FAILED", resource: "Auth", status: "warning", ip: "45.132.88.19", details: "Invalid credentials attempt. Progressive delay triggered." },
];

export const INITIAL_HISTORY: HistoryRecord[] = [
  { id: "imp-001", type: "import", filename: "october_patients_batch.xlsx", format: "xlsx", records_count: 42, success_count: 42, failed_count: 0, status: "Completed", timestamp: "2024-10-30 11:15", user: "Dr. Asim" },
  { id: "exp-002", type: "export", filename: "q3_hemophilia_registry.csv", format: "csv", records_count: 106, success_count: 106, failed_count: 0, status: "Completed", timestamp: "2024-10-28 16:30", user: "Admin" },
  { id: "imp-003", type: "import", filename: "punjab_htc_data.csv", format: "csv", records_count: 25, success_count: 24, failed_count: 1, status: "Partial", timestamp: "2024-10-20 10:05", user: "Data Clerk" },
];

export const MONTHLY_TRENDS = [
  { month: "2024-05", registrations: 4, treatments: 8, iu: 7200 },
  { month: "2024-06", registrations: 6, treatments: 11, iu: 9800 },
  { month: "2024-07", registrations: 5, treatments: 14, iu: 12500 },
  { month: "2024-08", registrations: 8, treatments: 16, iu: 14200 },
  { month: "2024-09", registrations: 7, treatments: 19, iu: 16800 },
  { month: "2024-10", registrations: 11, treatments: 23, iu: 19500 },
];
