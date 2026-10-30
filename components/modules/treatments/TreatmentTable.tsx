"use client";
import React, { useState } from "react";
import {
  Card,
  Badge,
  btnSecondary,
  BulkUploadModal,
  BulkDownloadModal,
} from "@/components/ui";
import { Upload, Download, Search } from "lucide-react";
import { TreatmentRecord, INITIAL_TREATMENTS } from "@/data/mockData";
import { useNav } from "@/context/providers";

interface TreatmentTableProps {
  patientId?: number;
  treatments?: TreatmentRecord[];
  isLiveDb?: boolean;
  onTreatmentsImported?: (newTreatments: TreatmentRecord[]) => void;
}

export default function TreatmentTable({
  patientId,
  treatments = INITIAL_TREATMENTS,
  isLiveDb = true,
  onTreatmentsImported,
}: TreatmentTableProps) {
  const { setSelectedPatientId, setActiveView } = useNav();
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const filtered = treatments
    .filter((t) => (patientId ? t.patient_id === patientId : true))
    .filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.patient_name.toLowerCase().includes(q) ||
        t.registration_no.toLowerCase().includes(q) ||
        t.injection_name.toLowerCase().includes(q) ||
        t.reason.toLowerCase().includes(q)
      );
    });

  const totalIu = filtered.reduce((acc, t) => acc + (t.dose_iu || 0), 0);

  return (
    <>
      <Card
        title={patientId ? "Patient Treatment History" : "Recent Factor Treatments Log"}
        subtitle={`Chronological log (${filtered.length} infusions, Total ${totalIu.toLocaleString()} IU factor administered):`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {!patientId && (
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search patient, injection, reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl neu-inset pl-8 pr-3 py-1.5 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00] max-w-xs"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk upload treatments from Excel or CSV"
            >
              <Upload size={14} className="text-[#EAAA00]" />
              <span>Bulk Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk download treatment records to Excel (.xlsx) or CSV (.csv)"
            >
              <Download size={14} className="text-[#EAAA00]" />
              <span>Bulk Download</span>
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-white/60 dark:border-[#38163f]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                {!patientId && <th className="px-3">Patient (H-#)</th>}
                <th className="px-3">Injection Product</th>
                <th className="px-3">Clinical Indication</th>
                <th className="px-3">Co-Meds</th>
                <th className="px-3 tabular-nums">Dose (IU)</th>
                <th className="px-3">Comments / Clinical Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-slate-200/50 dark:border-[#2d1433] hover:bg-white/40 dark:hover:bg-[#251229]/40 transition-colors"
                >
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-500">
                    {t.treatment_date}
                  </td>
                  {!patientId && (
                    <td className="px-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedPatientId(t.patient_id);
                          setActiveView("patient_details");
                        }}
                        className="font-bold text-[#EAAA00] hover:underline cursor-pointer"
                      >
                        {t.registration_no}
                      </button>{" "}
                      <span className="font-semibold text-[#3A0F34] dark:text-[#f6f1f7]">
                        {t.patient_name}
                      </span>
                    </td>
                  )}
                  <td className="px-3 font-semibold text-[#3A0F34] dark:text-[#f6f1f7]">
                    {t.injection_name}
                  </td>
                  <td className="px-3">
                    <Badge variant="primary" size="sm">{t.reason}</Badge>
                  </td>
                  <td className="px-3 text-slate-500">{t.medication || "-"}</td>
                  <td className="px-3 tabular-nums font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
                    {t.dose_iu ? t.dose_iu.toLocaleString() : "-"}
                  </td>
                  <td className="px-3 text-slate-600 dark:text-[#bdaec2] max-w-xs truncate">
                    {t.comments || "-"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No treatments found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Universal Bulk Upload Modal for Treatments */}
      <BulkUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        entityType="treatments"
        title="Bulk Upload Treatments (Excel / CSV)"
        isLiveDb={isLiveDb}
        onSuccess={(imported) => {
          if (onTreatmentsImported) onTreatmentsImported(imported);
        }}
      />

      {/* Universal Bulk Download Modal for Treatments */}
      <BulkDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        entityType="treatments"
        title="Bulk Download Treatments Log"
        data={treatments}
      />
    </>
  );
}
