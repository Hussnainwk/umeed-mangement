"use client";
import React, { useState } from "react";
import { TREATMENT_REASONS } from "@/data/fields";
import {
  btnCls,
  btnSecondary,
  Card,
  inputCls,
  Label,
  useToast,
} from "@/components/ui";
import { TreatmentRecord, PatientRecord, InjectionItem, INITIAL_INJECTIONS } from "@/data/mockData";

const today = () => new Date().toISOString().slice(0, 10);
const blank = {
  injection_id: "1",
  treatment_date: today(),
  reason: "Joint bleed",
  medication: "",
  dose_iu: "1000",
  comments: "",
};

interface TreatmentFormProps {
  patientId?: number;
  patientsList?: PatientRecord[];
  injectionsList?: InjectionItem[];
  onTreatmentAdded?: (treatment: TreatmentRecord) => void;
}

export default function TreatmentForm({
  patientId,
  patientsList = [],
  injectionsList,
  onTreatmentAdded,
}: TreatmentFormProps) {
  const { addToast } = useToast();
  const [pick, setPick] = useState("");
  const [f, setF] = useState(blank);
  const injections = injectionsList && injectionsList.length > 0 ? injectionsList : INITIAL_INJECTIONS;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: string, val: string) => setF((p) => ({ ...p, [k]: val }));

  const targetPatient = patientId
    ? patientsList.find((p) => p.patient_id === patientId)
    : patientsList.find(
        (p) => `${p.registration_no} - ${p.patient_name}`.toLowerCase() === pick.toLowerCase()
      ) || patientsList[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatient && !patientId) {
      addToast("error", "Patient Required", "Please select a patient to administer treatment.");
      return;
    }

    setIsSubmitting(true);

    const injection = injections.find((i) => String(i.id) === String(f.injection_id)) || injections[0];

    setTimeout(() => {
      const newTreatment: TreatmentRecord = {
        id: Date.now(),
        patient_id: targetPatient ? targetPatient.patient_id : patientId || 1,
        registration_no: targetPatient ? targetPatient.registration_no : "H-101",
        patient_name: targetPatient ? targetPatient.patient_name : "Muhammad Hamza",
        injection_id: injection.id,
        injection_name: injection.name,
        treatment_date: f.treatment_date,
        reason: f.reason,
        medication: f.medication || "None",
        dose_iu: Number(f.dose_iu) || 500,
        comments: f.comments || "Routine clinical factor infusion.",
      };

      if (onTreatmentAdded) {
        onTreatmentAdded(newTreatment);
      }

      setIsSubmitting(false);
      setF({ ...blank, treatment_date: f.treatment_date });
      setPick("");
      addToast(
        "success",
        "Treatment Logged",
        `Administered ${newTreatment.dose_iu} IU ${injection.name} to ${newTreatment.patient_name}`
      );
    }, 300);
  };

  return (
    <Card
      title="Administer &amp; Log Factor Treatment"
      subtitle="Record factor replacement therapy, dosage in IU, adverse reactions, and clinical bleeding indications."
    >
      <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
        {!patientId && (
          <Label text="Patient (Select by Registration # or Name)" required>
            <select
              className={inputCls}
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              required
            >
              <option value="">-- Choose Registered Patient --</option>
              {patientsList.map((p) => (
                <option
                  key={p.patient_id}
                  value={`${p.registration_no} - ${p.patient_name}`}
                >
                  {p.registration_no} - {p.patient_name} ({p.diagnosis})
                </option>
              ))}
            </select>
          </Label>
        )}

        <Label text="Treatment Infusion Date" required>
          <input
            className={inputCls}
            type="date"
            value={f.treatment_date}
            onChange={(e) => set("treatment_date", e.target.value)}
            required
          />
        </Label>

        <Label text="Injection / Product" required>
          <select
            className={inputCls}
            value={f.injection_id}
            onChange={(e) => set("injection_id", e.target.value)}
            required
          >
            {injections
              .filter((i) => i.is_active)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.strength || i.type})
                </option>
              ))}
          </select>
        </Label>

        <Label text="Clinical Indication / Reason" required>
          <select
            className={inputCls}
            value={f.reason}
            onChange={(e) => set("reason", e.target.value)}
            required
          >
            {TREATMENT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Label>

        <Label text="Dose (International Units - IU)" required>
          <input
            className={inputCls}
            type="number"
            min="1"
            max="10000"
            step="50"
            value={f.dose_iu}
            onChange={(e) => set("dose_iu", e.target.value)}
            placeholder="e.g. 1000"
            required
          />
        </Label>

        <Label text="Co-medication (Analgesic / Anti-fibrinolytic)">
          <input
            className={inputCls}
            value={f.medication}
            onChange={(e) => set("medication", e.target.value)}
            placeholder="e.g. Tranexamic acid, Paracetamol"
          />
        </Label>

        <div className="sm:col-span-2 lg:col-span-3">
          <Label text="Clinical Notes / Bleed Site &amp; Outcome">
            <input
              className={inputCls}
              value={f.comments}
              onChange={(e) => set("comments", e.target.value)}
              placeholder="e.g. Right elbow hemarthrosis. Pain subsided within 2 hours of infusion."
            />
          </Label>
        </div>

        <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setF(blank)}
            className={btnSecondary}
          >
            Clear Fields
          </button>
          <button type="submit" disabled={isSubmitting} className={btnCls}>
            {isSubmitting ? "Logging..." : "💉 Administer &amp; Save Treatment"}
          </button>
        </div>
      </form>
    </Card>
  );
}
