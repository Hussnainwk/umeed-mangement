"use client";
import React from "react";
import { Card, CardInset, Badge, btnSecondary, btnGhost, useToast } from "@/components/ui";
import { PatientRecord, TreatmentRecord } from "@/data/mockData";
import { SECTIONS } from "@/data/fields";
import { useNav } from "@/context/providers";
import TreatmentForm from "@/components/modules/treatments/TreatmentForm";
import TreatmentTable from "@/components/modules/treatments/TreatmentTable";

interface PatientDetailsProps {
  patient: PatientRecord;
  patients: PatientRecord[];
  treatments: TreatmentRecord[];
  onAddTreatment: (treatment: TreatmentRecord) => void;
}

export default function PatientDetails({
  patient,
  patients,
  treatments,
  onAddTreatment,
}: PatientDetailsProps) {
  const { setActiveView } = useNav();
  const { addToast } = useToast();

  const handleExportSummary = () => {
    const exportRow = [
      "Registration,Name,Diagnosis,Severity,City,Phone",
      `"${patient.registration_no}","${patient.patient_name}","${patient.diagnosis}","${patient.severity}","${patient.city}","${patient.telephone}"`,
    ].join("\n");
    const blob = new Blob([exportRow], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `patient_${patient.registration_no}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("info", "Summary Exported", "Patient record downloaded.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              {patient.registration_no} &bull; {patient.patient_name}
            </span>
            <Badge
              variant={
                patient.severity === "Severe"
                  ? "danger"
                  : patient.severity === "Moderate"
                  ? "warning"
                  : "success"
              }
            >
              {patient.severity} ({patient.baseline_factor_activity}%)
            </Badge>
          </div>
        }
        subtitle={`${patient.age} years old • ${patient.gender} • Blood Group: ${patient.blood_group} • Registered: ${patient.record_date}`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView("patients")}
              className={btnSecondary}
            >
              &larr; Back to Patients List
            </button>
            <button
              onClick={handleExportSummary}
              className={btnGhost}
            >
              Export Summary
            </button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <CardInset>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Diagnosis</p>
            <p className="font-bold text-sm text-[#3A0F34] dark:text-[#f6f1f7] mt-0.5">
              {patient.diagnosis}
            </p>
          </CardInset>
          <CardInset>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Treatment Type</p>
            <p className="font-bold text-sm text-[#3A0F34] dark:text-[#f6f1f7] mt-0.5">
              {patient.treatment_type}
            </p>
          </CardInset>
          <CardInset>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Inhibitor Status</p>
            <p className="font-bold text-sm text-[#3A0F34] dark:text-[#f6f1f7] mt-0.5">
              {patient.inhibitor_status}
            </p>
          </CardInset>
          <CardInset>
            <p className="text-[10px] text-slate-500 uppercase font-bold">CNIC Identity</p>
            <p className="font-mono text-sm text-[#3A0F34] dark:text-[#f6f1f7] mt-0.5">
              {patient.cnic || "Not provided"}
            </p>
          </CardInset>
        </div>
      </Card>

      {/* Quick Infusion Form for This Patient */}
      <TreatmentForm
        patientId={patient.patient_id}
        patientsList={patients}
        onTreatmentAdded={onAddTreatment}
      />

      {/* Treatment History for This Patient */}
      <TreatmentTable
        patientId={patient.patient_id}
        treatments={treatments}
      />

      {/* Full Clinical Form Fields from fields.ts */}
      {SECTIONS.map((section) => (
        <Card key={section.title} title={section.title}>
          <dl className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-3 pt-1">
            {section.fields.map((f) => {
              const val = (patient as any)[f.key];
              return (
                <div key={f.key} className="neu-inset p-3 rounded-xl">
                  <dt className="text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
                    {f.label}
                  </dt>
                  <dd className="font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
                    {val != null && val !== "" ? String(val) : "—"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Card>
      ))}
    </div>
  );
}
