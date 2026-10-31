export type Field = {
  key: string;
  label: string;
  type?: "text" | "date" | "number" | "select" | "bool" | "multi" | "textarea";
  options?: string[];
  required?: boolean;
  when?: [key: string, equals: string]; // show only if other field has this value ("yes"/"no" for bool)
};

const PNT = ["Positive", "Negative", "Not tested"];

export const SECTIONS: { title: string; fields: Field[] }[] = [
  { title: "Personal", fields: [
    { key: "patient_name", label: "Patient name", required: true },
    { key: "date_of_birth", label: "Date of birth", type: "date" },
    { key: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
    { key: "marital_status", label: "Marital status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] },
    { key: "cnic", label: "CNIC" },
    { key: "blood_group", label: "Blood group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    { key: "record_date", label: "Record date", type: "date" },
    { key: "qualification", label: "Qualification" },
    { key: "profession", label: "Profession" },
    { key: "job_title", label: "Job title" },
  ]},
  { title: "Contact", fields: [
    { key: "address", label: "Current address", type: "textarea" },
    { key: "city", label: "City" },
    { key: "city_town", label: "City / town" },
    { key: "province", label: "Province", type: "select", options: ["Punjab", "Sindh", "KPK", "Balochistan", "Gilgit-Baltistan", "AJK", "Islamabad"] },
    { key: "telephone", label: "Telephone" },
    { key: "emergency_number", label: "Emergency number" },
    { key: "email", label: "Email" },
    { key: "guardian_name", label: "Father / mother name" },
    { key: "guardian_cnic", label: "Father / mother CNIC" },
  ]},
  { title: "Household", fields: [
    { key: "household_other_bleeder", label: "Another person with a bleeding disorder in the household?", type: "bool" },
    { key: "household_patient_name", label: "Their name", when: ["household_other_bleeder", "yes"] },
    { key: "household_relation", label: "Relation to patient", when: ["household_other_bleeder", "yes"] },
  ]},
  { title: "Diagnosis", fields: [
    { key: "diagnosis", label: "Diagnosis", type: "select", options: ["Hemophilia A", "Hemophilia B", "von Willebrand disease", "Factor VII deficiency", "Factor XIII deficiency", "Glanzmann thrombasthenia", "Other"] },
    { key: "registered_with_chapter", label: "Registered with a UWF chapter / HTC?", type: "bool" },
    { key: "chapter_name", label: "Chapter / HTC name", when: ["registered_with_chapter", "yes"] },
    { key: "diagnostic_technique", label: "Diagnostic technique", type: "select", options: ["Factor assay", "Genetic testing", "Clinical", "Other"] },
    { key: "diagnostic_other", label: "Other diagnostics", when: ["diagnostic_technique", "Other"] },
    { key: "baseline_factor_activity", label: "Baseline factor activity (%)", type: "number" },
    { key: "diagnostic_reason", label: "Reason for diagnostic testing", type: "select", options: ["Bleeding symptoms", "Family history", "Screening", "Other"] },
    { key: "diagnostic_reason_other", label: "Other reason", when: ["diagnostic_reason", "Other"] },
    { key: "age_first_diagnosed", label: "Age first diagnosed", type: "number" },
  ]},
  { title: "Treatment", fields: [
    { key: "treatment_type", label: "Treatment type", type: "select", options: ["On-demand", "Prophylaxis", "None"] },
    { key: "inhibitor_status", label: "Current inhibitor status", type: "select", options: PNT },
    { key: "bleeding_episodes_12m", label: "Bleeding episodes in last 12 months", type: "number" },
    { key: "treatment_products", label: "Treatment products used mostly in last 12 months" },
  ]},
  { title: "Health", fields: [
    { key: "hcv", label: "HCV", type: "select", options: PNT },
    { key: "hiv", label: "HIV", type: "select", options: PNT },
    { key: "hbv", label: "HBV", type: "select", options: PNT },
    { key: "vaccinations", label: "Vaccinations", type: "multi", options: ["Hepatitis A", "Hepatitis B", "Tetanus", "Influenza", "COVID-19"] },
    { key: "other_vaccinations", label: "Other vaccinations" },
    { key: "joint_deformity", label: "Joint deformity", type: "select", options: ["None", "Mild", "Moderate", "Severe"] },
    { key: "activity_level", label: "Activity level", type: "select", options: ["Low", "Moderate", "High"] },
  ]},
  { title: "Form details", fields: [
    { key: "filled_by", label: "Form filled by" },
    { key: "designation", label: "Designation" },
    { key: "organization", label: "Organization" },
    { key: "comments", label: "Comments", type: "textarea" },
  ]},
];

export const TREATMENT_REASONS = [
  "Joint bleed", "Muscle bleed", "Mucosal bleed (nose / mouth / gum)", "Head injury",
  "Trauma", "Surgery / dental", "Prophylaxis", "Immune tolerance", "Other",
];
