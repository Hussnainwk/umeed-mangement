"use client";
import React, { useState, useMemo } from "react";
import { SECTIONS, Field } from "@/data/fields";
import {
  btnCls,
  btnSecondary,
  btnGhost,
  Card,
  inputCls,
  Label,
  Badge,
  useToast,
  BulkUploadModal,
  BulkDownloadModal,
} from "@/components/ui";
import { Sparkles, Upload, Download } from "lucide-react";
import { useNav } from "@/context/providers";
import { PatientRecord } from "@/data/mockData";

const today = () => new Date().toISOString().slice(0, 10);

const SECTION_ICONS: Record<string, string> = {
  Personal: "👤",
  Contact: "📍",
  Household: "🏠",
  Diagnosis: "🧬",
  Treatment: "💉",
  Health: "🧪",
  "Form details": "📝",
};

interface PatientFormProps {
  onSuccess?: (newPatient: PatientRecord) => void;
  initialData?: PatientRecord;
  isLiveDb?: boolean;
  patients?: PatientRecord[];
  onPatientsImported?: (newPatients: PatientRecord[]) => void;
}

export default function PatientForm({
  onSuccess,
  initialData,
  isLiveDb = true,
  patients = [],
  onPatientsImported,
}: PatientFormProps) {
  const { setActiveView, setSelectedPatientId } = useNav();
  const { addToast } = useToast();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [v, setV] = useState<Record<string, any>>(() => {
    if (initialData) {
      return {
        ...initialData,
        household_other_bleeder:
          initialData.bleeding_episodes_12m > 0 ? "yes" : "no",
      };
    }
    return {
      record_date: today(),
      gender: "Male",
      marital_status: "Single",
      province: "Punjab",
      diagnosis: "Hemophilia A",
      treatment_type: "On-demand",
      inhibitor_status: "Negative",
      hcv: "Negative",
      hiv: "Negative",
      hbv: "Negative",
      joint_deformity: "None",
      activity_level: "Moderate",
    };
  });

  // Track expanded/minimized state for each section
  // Default: First section (Personal) expanded, others minimized for cleaner step-by-step UX
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    SECTIONS.forEach((s, idx) => {
      initial[s.title] = idx === 0; // only Personal expanded initially
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: string, val: any) => setV((p) => ({ ...p, [k]: val }));
  const visible = (f: Field) =>
    !f.when || String(v[f.when[0]] ?? "") === f.when[1];

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    SECTIONS.forEach((s) => (allExp[s.title] = true));
    setExpandedSections(allExp);
  };

  const collapseAll = () => {
    const allCol: Record<string, boolean> = {};
    SECTIONS.forEach((s) => (allCol[s.title] = false));
    setExpandedSections(allCol);
  };

  // ── Autofill Realistic Test Dummy Data ──────────────────────────────────────
  const handleAutofillDummyData = () => {
    const sampleProfiles = [
      {
        name: "Muhammad Ali Khan",
        dob: "2000-04-18",
        gender: "Male",
        blood: "O+",
        city: "Rawalpindi",
        province: "Punjab",
        guardian: "Tariq Mahmood Khan",
        dx: "Hemophilia A",
        baseline: 0.8,
        bleeds: 4,
        treatment: "On-demand",
      },
      {
        name: "Ahmed Raza",
        dob: "1998-11-09",
        gender: "Male",
        blood: "A+",
        city: "Islamabad",
        province: "Islamabad",
        guardian: "Muhammad Raza",
        dx: "Hemophilia A",
        baseline: 1.2,
        bleeds: 6,
        treatment: "Prophylaxis",
      },
      {
        name: "Usman Tariq",
        dob: "2004-02-14",
        gender: "Male",
        blood: "B+",
        city: "Lahore",
        province: "Punjab",
        guardian: "Tariq Bashir",
        dx: "Hemophilia B",
        baseline: 2.5,
        bleeds: 3,
        treatment: "On-demand",
      },
      {
        name: "Hamza Bilal",
        dob: "2002-08-25",
        gender: "Male",
        blood: "AB+",
        city: "Peshawar",
        province: "KPK",
        guardian: "Bilal Ahmad",
        dx: "von Willebrand disease",
        baseline: 5.0,
        bleeds: 2,
        treatment: "On-demand",
      },
    ];

    const pick =
      sampleProfiles[Math.floor(Math.random() * sampleProfiles.length)];

    // Generate valid Pakistani CNIC format (chk_cnic constraint: '^\d{5}-?\d{7}-?\d$')
    const rand5 = Math.floor(10000 + Math.random() * 90000);
    const rand7 = Math.floor(1000000 + Math.random() * 9000000);
    const rand1 = Math.floor(1 + Math.random() * 9);
    const validCnic = `${rand5}-${rand7}-${rand1}`;

    const gRand5 = Math.floor(10000 + Math.random() * 90000);
    const gRand7 = Math.floor(1000000 + Math.random() * 9000000);
    const gRand1 = Math.floor(1 + Math.random() * 9);
    const validGuardianCnic = `${gRand5}-${gRand7}-${gRand1}`;

    const phoneRand = Math.floor(1000000 + Math.random() * 9000000);
    const validPhone = `+92 300 ${phoneRand}`;

    const dummy: Record<string, any> = {
      patient_name: pick.name,
      date_of_birth: pick.dob,
      gender: pick.gender,
      marital_status: "Single",
      cnic: validCnic,
      blood_group: pick.blood,
      record_date: today(),
      qualification: "Undergraduate / BS",
      profession: "Student / Trainee",
      job_title: "Laboratory Intern",
      address: `House #${Math.floor(1 + Math.random() * 150)}, Street #${Math.floor(1 + Math.random() * 15)}, Sector G-10`,
      city: pick.city,
      city_town: pick.city,
      province: pick.province,
      telephone: validPhone,
      emergency_number: "+92 321 7654321",
      email: `${pick.name.toLowerCase().replace(/\s+/g, ".")}${Math.floor(10 + Math.random() * 89)}@example.com`,
      guardian_name: pick.guardian,
      guardian_cnic: validGuardianCnic,
      household_other_bleeder: "no",
      diagnosis: pick.dx,
      registered_with_chapter: "yes",
      chapter_name: "Rawalpindi / Islamabad Chapter - PHPWS",
      diagnostic_technique: "Factor assay",
      baseline_factor_activity: pick.baseline,
      diagnostic_reason: "Bleeding symptoms",
      age_first_diagnosed: 3,
      treatment_type: pick.treatment,
      inhibitor_status: "Negative",
      bleeding_episodes_12m: pick.bleeds,
      treatment_products:
        pick.dx === "Hemophilia B" ? "Factor IX" : "Factor VIII (Recombinant)",
      hcv: "Negative",
      hiv: "Negative",
      hbv: "Negative",
      vaccinations: ["Hepatitis A", "Hepatitis B", "Tetanus"],
      joint_deformity: "Mild",
      activity_level: "Moderate",
      filled_by: "Dr. Hammad (Lead Administrator)",
      designation: "Clinical Officer",
      organization: "Pakistan Hemophilia Patients Welfare Society",
      comments:
        "Automated test enrollment dummy data for verifying database synchronization and API upload.",
    };

    setV(dummy);
    expandAll();
    addToast(
      "info",
      "Dummy Data Populated",
      `Realistic test profile for "${pick.name}" autofilled. Click "Save Patient Record" to test uploading.`,
    );
  };

  // Section completion checks
  const getSectionStatus = (
    title: string,
  ): { completed: boolean; filledCount: number; totalCount: number } => {
    const sec = SECTIONS.find((s) => s.title === title);
    if (!sec) return { completed: false, filledCount: 0, totalCount: 0 };

    const visibleFields = sec.fields.filter(visible);
    const filledFields = visibleFields.filter((f) => {
      const val = v[f.key];
      if (f.key === "patient_name")
        return Boolean(val && val.trim().length >= 2);
      return val !== undefined && val !== "" && val !== null;
    });

    // Personal is completed if required patient_name is filled and at least 3 other attributes are present
    const completed =
      title === "Personal"
        ? Boolean(
            v.patient_name &&
            v.patient_name.trim().length >= 2 &&
            v.gender &&
            v.blood_group,
          )
        : filledFields.length >= Math.min(2, visibleFields.length);

    return {
      completed,
      filledCount: filledFields.length,
      totalCount: visibleFields.length,
    };
  };

  // Overall form progress percentage
  const formProgress = useMemo(() => {
    let completedSections = 0;
    SECTIONS.forEach((s) => {
      if (getSectionStatus(s.title).completed) completedSections++;
    });
    return Math.round((completedSections / SECTIONS.length) * 100);
  }, [v]);

  // Navigate to next section
  const handleNextSection = (currentIndex: number) => {
    const currentTitle = SECTIONS[currentIndex].title;

    // Validate basics if on personal
    if (
      currentTitle === "Personal" &&
      (!v.patient_name || v.patient_name.trim().length < 2)
    ) {
      addToast(
        "error",
        "Basic Detail Required",
        "Please enter patient name before proceeding.",
      );
      return;
    }

    if (currentIndex < SECTIONS.length - 1) {
      const nextTitle = SECTIONS[currentIndex + 1].title;
      setExpandedSections((prev) => ({
        ...prev,
        [currentTitle]: false, // collapse current
        [nextTitle]: true, // expand next
      }));
      addToast(
        "success",
        "Section Completed",
        `Moving to Step ${currentIndex + 2}: ${nextTitle}`,
      );
    }
  };

  // Navigate to previous section
  const handlePrevSection = (currentIndex: number) => {
    if (currentIndex > 0) {
      const currentTitle = SECTIONS[currentIndex].title;
      const prevTitle = SECTIONS[currentIndex - 1].title;
      setExpandedSections((prev) => ({
        ...prev,
        [currentTitle]: false,
        [prevTitle]: true,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.patient_name || v.patient_name.trim().length < 2) {
      addToast(
        "error",
        "Name Required",
        "Please enter a valid patient full name in Personal Basics.",
      );
      // Auto expand personal
      setExpandedSections((prev) => ({ ...prev, Personal: true }));
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedId =
        initialData?.patient_id || Math.floor(Math.random() * 800) + 200;
      const regNo = initialData?.registration_no || `H-${generatedId}`;

      const newRecord: PatientRecord = {
        patient_id: generatedId,
        registration_no: regNo,
        patient_name: v.patient_name,
        date_of_birth: v.date_of_birth || "2000-01-01",
        age: v.date_of_birth
          ? 2024 - parseInt(v.date_of_birth.slice(0, 4))
          : 24,
        gender: v.gender || "Male",
        marital_status: v.marital_status || "Single",
        cnic: v.cnic || "",
        blood_group: v.blood_group || "O+",
        record_date: v.record_date || today(),
        qualification: v.qualification || "Unspecified",
        profession: v.profession || "Unspecified",
        job_title: v.job_title || "Unspecified",
        address: v.address || "Local Address",
        city: v.city || "Rawalpindi",
        province: v.province || "Punjab",
        telephone: v.telephone || "+92 300 1234567",
        email: v.email || "",
        guardian_name: v.guardian_name || "Guardian",
        guardian_cnic: v.guardian_cnic || undefined,
        diagnosis: v.diagnosis || "Hemophilia A",
        severity:
          Number(v.baseline_factor_activity) < 1
            ? "Severe"
            : Number(v.baseline_factor_activity) <= 5
              ? "Moderate"
              : "Mild",
        baseline_factor_activity: Number(v.baseline_factor_activity) || 1.2,
        treatment_type: v.treatment_type || "On-demand",
        inhibitor_status: v.inhibitor_status || "Negative",
        bleeding_episodes_12m: Number(v.bleeding_episodes_12m) || 0,
        treatment_products: v.treatment_products || "Factor VIII",
        hcv: v.hcv || "Negative",
        hiv: v.hiv || "Negative",
        hbv: v.hbv || "Negative",
        status: "active",
      };

      if (onSuccess) {
        onSuccess(newRecord);
      }

      setIsSubmitting(false);
      addToast(
        "success",
        initialData
          ? "Patient Profile Updated"
          : "Patient Registered Successfully",
        `${newRecord.registration_no} - ${newRecord.patient_name} has been enrolled in the registry.`,
      );
      setSelectedPatientId(newRecord.patient_id);
      setActiveView("patients");
    }, 350);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 animate-in fade-in duration-300"
    >
      {/* 1. Header & Stepper Telemetry */}
      <div className="neu-card p-5 border border-white/60 dark:border-[#3d1c43]/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/50 dark:border-[#38163f]/60">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl neu-inset text-base">➕</span>
              <h2 className="text-xl font-bold tracking-tight text-[#3A0F34] dark:text-[#f6f1f7]">
                {initialData
                  ? `Edit Record: ${initialData.registration_no}`
                  : "New Patient Registry Enrollment"}
              </h2>
              <Badge variant="primary">Auto H-# Generation</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#bdaec2] mt-1">
              Step-by-step registration with collapsible sections. Complete the
              basic details first to advance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutofillDummyData}
              className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-[#190617] bg-[#EAAA00] hover:bg-[#d49a00] flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
              title="Click to instantly autofill realistic patient test data to verify database upload"
            >
              <Sparkles size={14} className="text-[#190617]" />
              <span>⚡ Fill Dummy Data</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk upload patients from Excel (.xlsx) or CSV (.csv)"
            >
              <Upload size={14} className="text-[#EAAA00]" />
              <span>Bulk Enroll</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk download patient records or template"
            >
              <Download size={14} className="text-[#EAAA00]" />
              <span>Bulk Download</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("patients")}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={btnCls}>
              {isSubmitting ? "Enrolling..." : "💾 Save Patient Record"}
            </button>
          </div>
        </div>

        {/* Progress Bar & Expand/Minimize Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-[#3A0F34] dark:text-[#f6f1f7]">
                Enrollment Completion Progress
              </span>
              <span className="text-[#EAAA00] font-bold">{formProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 neu-inset overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#EAAA00] to-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${formProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutofillDummyData}
              className="neu-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#EAAA00] hover:text-[#b88500] flex items-center gap-1 cursor-pointer"
              title="Autofill realistic test data"
            >
              <Sparkles size={13} />
              <span>Fill Dummy</span>
            </button>
            <button
              type="button"
              onClick={expandAll}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#EAAA00]"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#EAAA00]"
            >
              Minimize All
            </button>
          </div>
        </div>

        {/* Stepper Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 overflow-x-auto">
          {SECTIONS.map((sec, idx) => {
            const status = getSectionStatus(sec.title);
            const isExpanded = expandedSections[sec.title];
            return (
              <button
                key={sec.title}
                type="button"
                onClick={() => toggleSection(sec.title)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isExpanded
                    ? "neu-inset text-[#EAAA00] font-bold"
                    : "neu-btn text-slate-600 dark:text-slate-300 hover:text-[#3A0F34] dark:hover:text-[#f6f1f7]"
                }`}
              >
                <span>{SECTION_ICONS[sec.title] || "📋"}</span>
                <span>{sec.title}</span>
                {status.completed ? (
                  <span className="text-[10px] text-emerald-600 font-bold">
                    ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    {status.filledCount}/{status.totalCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Sections (Collapsible Accordions) */}
      <div className="space-y-4">
        {SECTIONS.map((s, idx) => {
          const isExpanded = expandedSections[s.title];
          const status = getSectionStatus(s.title);
          const icon = SECTION_ICONS[s.title] || "📋";

          return (
            <div
              key={s.title}
              className="neu-card border border-white/60 dark:border-[#3d1c43]/60 overflow-hidden transition-all duration-200"
            >
              {/* Accordion Header bar */}
              <div
                onClick={() => toggleSection(s.title)}
                className="p-4 flex items-center justify-between cursor-pointer select-none bg-white/20 dark:bg-[#1a0c1d]/30 hover:bg-white/40 dark:hover:bg-[#25102a]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-sm font-bold">
                    {icon}
                  </div>
                  <div>
                    <div className="sm:flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#3A0F34] dark:text-[#f6f1f7]">
                        Step {idx + 1}: {s.title} Details
                      </h3>
                      {s.title === "Personal" && (
                        <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                      {status.completed && (
                        <Badge variant="success" size="sm">
                          Completed ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {status.filledCount} of {status.totalCount} fields
                      documented
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {isExpanded ? "▲ Minimize" : "▼ Expand"}
                  </span>
                  <div className="w-6 h-6 rounded-lg neu-btn flex items-center justify-center text-xs">
                    {isExpanded ? "−" : "+"}
                  </div>
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="p-5 border-t border-white/50 dark:border-[#38163f]/60 space-y-4 animate-in fade-in duration-200">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {s.fields.filter(visible).map((f) => (
                      <div
                        key={f.key}
                        className={
                          f.type === "textarea"
                            ? "sm:col-span-2 lg:col-span-3"
                            : ""
                        }
                      >
                        <Label text={f.label} required={f.required}>
                          {f.type === "select" || f.type === "bool" ? (
                            <select
                              className={inputCls}
                              value={v[f.key] ?? ""}
                              onChange={(e) => set(f.key, e.target.value)}
                            >
                              <option value="">Select option...</option>
                              {(f.type === "bool"
                                ? ["yes", "no"]
                                : f.options!
                              ).map((o) => (
                                <option key={o} value={o}>
                                  {f.type === "bool"
                                    ? o === "yes"
                                      ? "Yes"
                                      : "No"
                                    : o}
                                </option>
                              ))}
                            </select>
                          ) : f.type === "multi" ? (
                            <div className="flex flex-wrap gap-2 py-1">
                              {f.options!.map((o) => {
                                const arr = (v[f.key] as string[]) ?? [];
                                const checked = arr.includes(o);
                                return (
                                  <label
                                    key={o}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                                      checked
                                        ? "neu-inset text-[#EAAA00] font-bold"
                                        : "neu-btn text-slate-600 dark:text-slate-300"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = e.target.checked
                                          ? [...arr, o]
                                          : arr.filter((x) => x !== o);
                                        set(f.key, next);
                                      }}
                                    />
                                    {checked ? "✓ " : ""}
                                    {o}
                                  </label>
                                );
                              })}
                            </div>
                          ) : f.type === "textarea" ? (
                            <textarea
                              rows={2}
                              className={inputCls}
                              value={v[f.key] ?? ""}
                              onChange={(e) => set(f.key, e.target.value)}
                              placeholder={`Enter ${f.label.toLowerCase()}...`}
                            />
                          ) : (
                            <input
                              type={f.type ?? "text"}
                              className={inputCls}
                              value={v[f.key] ?? ""}
                              onChange={(e) => set(f.key, e.target.value)}
                              placeholder={`Enter ${f.label.toLowerCase()}...`}
                              required={f.required}
                            />
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Section Stepper Navigation Buttons */}
                  <div className="pt-3 border-t border-white/50 dark:border-[#38163f]/60 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handlePrevSection(idx)}
                          className={btnGhost}
                        >
                          &larr; Back to {SECTIONS[idx - 1].title}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {idx < SECTIONS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => handleNextSection(idx)}
                          className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-[#190617] bg-[#EAAA00] hover:bg-[#d49a00] cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <span>Continue to {SECTIONS[idx + 1].title}</span>
                          <span>&rarr;</span>
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={btnCls}
                        >
                          {isSubmitting
                            ? "Saving..."
                            : "💾 Save Patient Record"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Global Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 neu-card rounded-2xl">
        <div className="text-xs text-slate-500">
          Enrolling into PHPWS Hemophilia Clinical Registry database
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutofillDummyData}
            className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-[#190617] bg-[#EAAA00] hover:bg-[#d49a00] flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            title="Autofill realistic dummy data"
          >
            <Sparkles size={14} />
            <span>⚡ Fill Dummy Data</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("patients")}
            className={btnSecondary}
          >
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={btnCls}>
            {isSubmitting ? "Saving..." : "💾 Save Patient Record"}
          </button>
        </div>
      </div>

      {/* Universal Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        entityType="patients"
        title="Bulk Enroll Patients (Excel / CSV)"
        isLiveDb={isLiveDb}
        onSuccess={(imported) => {
          if (onPatientsImported) onPatientsImported(imported);
          setActiveView("patients");
        }}
      />

      {/* Universal Bulk Download Modal */}
      <BulkDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        entityType="patients"
        title="Bulk Download Patients Registry"
        data={patients}
      />
    </form>
  );
}
