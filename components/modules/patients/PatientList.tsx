"use client";
import React, { useState } from "react";
import {
  Card,
  Badge,
  btnCls,
  btnSecondary,
  btnDanger,
  BulkUploadModal,
  BulkDownloadModal,
} from "@/components/ui";
import { Upload, Download } from "lucide-react";
import { PatientRecord } from "@/data/mockData";
import { useNav } from "@/context/providers";

interface PatientListProps {
  patients: PatientRecord[];
  filteredPatients: PatientRecord[];
  patientSearch: string;
  setPatientSearch: (val: string) => void;
  filterDiag: string;
  setFilterDiag: (val: string) => void;
  filterSev: string;
  setFilterSev: (val: string) => void;
  filterProv: string;
  setFilterProv: (val: string) => void;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onBulkDelete: () => void;
  onSelectDeleteCandidate: (patient: PatientRecord) => void;
  onEditPatient?: (patient: PatientRecord) => void;
  isLiveDb?: boolean;
  onPatientsImported?: (newPatients: PatientRecord[]) => void;
}

export default function PatientList({
  patients,
  filteredPatients,
  patientSearch,
  setPatientSearch,
  filterDiag,
  setFilterDiag,
  filterSev,
  setFilterSev,
  filterProv,
  setFilterProv,
  selectedIds,
  setSelectedIds,
  onBulkDelete,
  onSelectDeleteCandidate,
  onEditPatient,
  isLiveDb = true,
  onPatientsImported,
}: PatientListProps) {
  const { setActiveView, setSelectedPatientId } = useNav();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredPatients.map((p) => p.patient_id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Patient &amp; User Registry
            </span>
            <Badge variant="primary">{patients.length} Total Records</Badge>
          </div>
        }
        subtitle="Search, filter, view complete medical profiles, perform bulk exports, and manage patient accounts."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <button onClick={onBulkDelete} className={btnDanger}>
                Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk upload patients from Excel or CSV with automatic format detection and offline sync"
            >
              <Upload size={14} className="text-[#EAAA00]" />
              <span>Bulk Upload</span>
            </button>
            <button
              onClick={() => setShowDownloadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk download patient records to Excel (.xlsx) or CSV (.csv)"
            >
              <Download size={14} className="text-[#EAAA00]" />
              <span>Bulk Download</span>
            </button>
            <button
              onClick={() => setActiveView("patients_new")}
              className={btnCls}
            >
              ➕ Register New Patient
            </button>
          </div>
        }
      >
        {/* Search and Filters Bar */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <input
            type="text"
            placeholder="Search by name, H-#, CNIC, phone, city..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="rounded-xl neu-inset px-3.5 py-2 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
          />

          <select
            value={filterDiag}
            onChange={(e) => setFilterDiag(e.target.value)}
            className="rounded-xl neu-inset px-3 py-2 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
          >
            <option value="all">All Diagnoses</option>
            <option value="Hemophilia A">Hemophilia A</option>
            <option value="Hemophilia B">Hemophilia B</option>
            <option value="von Willebrand disease">von Willebrand disease</option>
            <option value="Factor VII deficiency">Factor VII deficiency</option>
          </select>

          <select
            value={filterSev}
            onChange={(e) => setFilterSev(e.target.value)}
            className="rounded-xl neu-inset px-3 py-2 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
          >
            <option value="all">All Severities</option>
            <option value="Severe">Severe (&lt; 1%)</option>
            <option value="Moderate">Moderate (1-5%)</option>
            <option value="Mild">Mild (&gt; 5%)</option>
          </select>

          <select
            value={filterProv}
            onChange={(e) => setFilterProv(e.target.value)}
            className="rounded-xl neu-inset px-3 py-2 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
          >
            <option value="all">All Provinces</option>
            <option value="Punjab">Punjab</option>
            <option value="Sindh">Sindh</option>
            <option value="KPK">KPK</option>
            <option value="Balochistan">Balochistan</option>
            <option value="Islamabad">Islamabad</option>
          </select>
        </div>
      </Card>

      {/* Patients Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-white/60 dark:border-[#38163f]">
              <tr>
                <th className="py-2.5 px-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === filteredPatients.length
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded accent-[#EAAA00] cursor-pointer"
                  />
                </th>
                <th className="px-3">Reg #</th>
                <th className="px-3">Full Name</th>
                <th className="px-3">Age / Sex</th>
                <th className="px-3">Diagnosis</th>
                <th className="px-3">Severity</th>
                <th className="px-3">City / Province</th>
                <th className="px-3">Phone</th>
                <th className="px-3">Status</th>
                <th className="px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => {
                const isSelected = selectedIds.includes(p.patient_id);
                return (
                  <tr
                    key={p.patient_id}
                    className={`border-t border-slate-200/50 dark:border-[#2d1433] hover:bg-white/40 dark:hover:bg-[#251229]/40 transition-colors ${
                      isSelected ? "bg-[#EAAA00]/10 dark:bg-[#EAAA00]/10" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(p.patient_id)}
                        className="rounded accent-[#EAAA00] cursor-pointer"
                      />
                    </td>
                    <td className="px-3 font-mono font-bold text-[#EAAA00]">
                      <button
                        onClick={() => {
                          setSelectedPatientId(p.patient_id);
                          setActiveView("patient_details");
                        }}
                        className="hover:underline cursor-pointer"
                      >
                        {p.registration_no}
                      </button>
                    </td>
                    <td className="px-3 font-semibold text-[#3A0F34] dark:text-[#f6f1f7]">
                      {p.patient_name}
                    </td>
                    <td className="px-3 text-slate-500">
                      {p.age}y &bull; {p.gender}
                    </td>
                    <td className="px-3 font-medium">{p.diagnosis}</td>
                    <td className="px-3">
                      <Badge
                        variant={
                          p.severity === "Severe"
                            ? "danger"
                            : p.severity === "Moderate"
                            ? "warning"
                            : "success"
                        }
                        size="sm"
                      >
                        {p.severity}
                      </Badge>
                    </td>
                    <td className="px-3">
                      {p.city}, {p.province}
                    </td>
                    <td className="px-3 font-mono">{p.telephone}</td>
                    <td className="px-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                          p.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      <span className="capitalize">{p.status}</span>
                    </td>
                    <td className="px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (onEditPatient) {
                              onEditPatient(p);
                            } else {
                              setSelectedPatientId(p.patient_id);
                              setActiveView("patients_edit");
                            }
                          }}
                          className="neu-btn px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-[#EAAA00] cursor-pointer"
                          title="Edit Patient Record"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatientId(p.patient_id);
                            setActiveView("patient_details");
                          }}
                          className="neu-btn px-2.5 py-1 rounded-lg text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] cursor-pointer"
                          title="View Patient Record"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => onSelectDeleteCandidate(p)}
                          className="neu-btn px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                          title="Delete Patient"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No patients found matching your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Universal Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        entityType="patients"
        title="Bulk Upload Patients (Excel / CSV)"
        isLiveDb={isLiveDb}
        onSuccess={(imported) => {
          if (onPatientsImported) onPatientsImported(imported);
        }}
      />

      {/* Universal Bulk Download Modal */}
      <BulkDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        entityType="patients"
        title="Bulk Download Patients Registry"
        data={patients}
        selectedIds={selectedIds}
      />
    </div>
  );
}
