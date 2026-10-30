"use client";
import React, { useState } from "react";
import {
  Card,
  Badge,
  Label,
  btnCls,
  btnSecondary,
  inputCls,
  useToast,
  BulkUploadModal,
  BulkDownloadModal,
} from "@/components/ui";
import { Upload, Download } from "lucide-react";
import { InjectionItem } from "@/data/mockData";

interface InjectionsCatalogProps {
  injections: InjectionItem[];
  setInjections: React.Dispatch<React.SetStateAction<InjectionItem[]>>;
  isLiveDb?: boolean;
}

export default function InjectionsCatalog({
  injections,
  setInjections,
  isLiveDb = true,
}: InjectionsCatalogProps) {
  const { addToast } = useToast();
  const [newInj, setNewInj] = useState({ name: "", type: "", strength: "" });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const handleAddInjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInj.name.trim()) return;
    const item: InjectionItem = {
      id: Date.now(),
      name: newInj.name.trim(),
      type: newInj.type || "Factor VIII",
      strength: newInj.strength || "500 IU",
      is_active: true,
    };
    setInjections((prev) => [...prev, item]);
    setNewInj({ name: "", type: "", strength: "" });
    addToast("success", "Product Registered", `Added ${item.name} to available injections.`);
  };

  const toggleInjectionStatus = (id: number) => {
    setInjections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_active: !i.is_active } : i))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card
        title="Available Injection & Factor Products"
        subtitle="Catalog of recombinant factors, plasma-derived concentrates, and bypassing agents:"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk upload injections catalog from Excel or CSV"
            >
              <Upload size={14} className="text-[#EAAA00]" />
              <span>Bulk Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk download injections catalog to Excel (.xlsx) or CSV (.csv)"
            >
              <Download size={14} className="text-[#EAAA00]" />
              <span>Bulk Download</span>
            </button>
          </div>
        }
      >
        {/* Add injection form */}
        <form onSubmit={handleAddInjection} className="grid gap-4 sm:grid-cols-4 items-end pt-2">
          <Label text="Product Name" required>
            <input
              className={inputCls}
              placeholder="e.g. Factor VIII"
              value={newInj.name}
              onChange={(e) => setNewInj({ ...newInj, name: e.target.value })}
              required
            />
          </Label>
          <Label text="Therapeutic Class">
            <input
              className={inputCls}
              placeholder="e.g. Factor VIII, Bypassing"
              value={newInj.type}
              onChange={(e) => setNewInj({ ...newInj, type: e.target.value })}
            />
          </Label>
          <Label text="Strength / Vials">
            <input
              className={inputCls}
              placeholder="e.g. 250 / 500 / 1000 IU"
              value={newInj.strength}
              onChange={(e) => setNewInj({ ...newInj, strength: e.target.value })}
            />
          </Label>
          <button type="submit" className={btnCls}>
            ➕ Add Injection
          </button>
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-white/60 dark:border-[#38163f]">
              <tr>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="px-3">Therapeutic Class</th>
                <th className="px-3">Available Strengths</th>
                <th className="px-3">Availability</th>
                <th className="px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {injections.map((i) => (
                <tr
                  key={i.id}
                  className="border-t border-slate-200/50 dark:border-[#2d1433]"
                >
                  <td className="py-2.5 px-3 font-semibold text-[#3A0F34] dark:text-[#f6f1f7]">
                    {i.name}
                  </td>
                  <td className="px-3">{i.type || "Factor"}</td>
                  <td className="px-3 font-mono">{i.strength || "—"}</td>
                  <td className="px-3">
                    <Badge variant={i.is_active ? "success" : "neutral"} size="sm">
                      {i.is_active ? "In Stock / Available" : "Archived / Hidden"}
                    </Badge>
                  </td>
                  <td className="px-3 text-right">
                    <button
                      onClick={() => toggleInjectionStatus(i.id)}
                      className="neu-btn px-2.5 py-1 rounded-lg text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] cursor-pointer"
                    >
                      {i.is_active ? "Hide from Registry" : "Make Available"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Universal Bulk Upload Modal for Injections */}
      <BulkUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        entityType="injections"
        title="Bulk Upload Injections Catalog (Excel / CSV)"
        isLiveDb={isLiveDb}
        onSuccess={(imported) => {
          setInjections((prev) => [...imported, ...prev]);
        }}
      />

      {/* Universal Bulk Download Modal for Injections */}
      <BulkDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        entityType="injections"
        title="Bulk Download Injections Catalog"
        data={injections}
      />
    </div>
  );
}
