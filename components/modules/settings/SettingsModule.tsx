"use client";
import React, { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import { PatientRecord, TreatmentRecord, InjectionItem, HistoryRecord } from "@/data/mockData";
import { useNav, AppView } from "@/context/providers";

// Modules
import ImportModule from "@/components/modules/import-export/ImportModule";
import ExportModule from "@/components/modules/import-export/ExportModule";
import HistoryModule from "@/components/modules/import-export/HistoryModule";
import InjectionsCatalog from "@/components/modules/injections/InjectionsCatalog";
import TypographyStudio from "@/components/modules/typography/TypographyStudio";
import RolesModule from "@/components/modules/roles/RolesModule";
import SecurityAuditModule from "@/components/modules/security/SecurityAuditModule";

export type SettingsTab =
  | "import"
  | "export"
  | "history"
  | "injections"
  | "typography"
  | "roles"
  | "security";

interface SettingsModuleProps {
  patients: PatientRecord[];
  setPatients: React.Dispatch<React.SetStateAction<PatientRecord[]>>;
  treatments: TreatmentRecord[];
  injections: InjectionItem[];
  setInjections: React.Dispatch<React.SetStateAction<InjectionItem[]>>;
  history: HistoryRecord[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryRecord[]>>;
  isLiveDb?: boolean;
}

const SETTINGS_NAV = [
  { id: "import" as SettingsTab, label: "Batch Import", icon: "📥", badge: "CSV/XLSX" },
  { id: "export" as SettingsTab, label: "Export Data", icon: "📤", badge: "Reports" },
  { id: "history" as SettingsTab, label: "Import/Export History", icon: "📜", badge: "Audit" },
  { id: "injections" as SettingsTab, label: "Injections Catalog", icon: "🧪", badge: "Vials" },
  { id: "typography" as SettingsTab, label: "Typography Studio", icon: "🎨", badge: "10 Fonts" },
  { id: "roles" as SettingsTab, label: "Roles & Permissions", icon: "🛡️", badge: "RBAC" },
  { id: "security" as SettingsTab, label: "Security & Audit", icon: "🔒", badge: "Protected" },
];

export default function SettingsModule({
  patients,
  setPatients,
  treatments,
  injections,
  setInjections,
  history,
  setHistory,
  isLiveDb = true,
}: SettingsModuleProps) {
  const { activeView, setActiveView } = useNav();

  // Map activeView to subtab if activeView is one of the specific sub-views
  const getInitialTab = (): SettingsTab => {
    if (
      activeView === "import" ||
      activeView === "export" ||
      activeView === "history" ||
      activeView === "injections" ||
      activeView === "typography" ||
      activeView === "roles" ||
      activeView === "security"
    ) {
      return activeView as SettingsTab;
    }
    return "import";
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(getInitialTab);

  useEffect(() => {
    if (
      activeView === "import" ||
      activeView === "export" ||
      activeView === "history" ||
      activeView === "injections" ||
      activeView === "typography" ||
      activeView === "roles" ||
      activeView === "security"
    ) {
      setActiveTab(activeView as SettingsTab);
    }
  }, [activeView]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setActiveView(tab as AppView);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Settings Header banner */}
      <div className="neu-card p-5 border border-white/60 dark:border-[#3d1c43]/60">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/50 dark:border-[#38163f]/60">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl neu-inset text-base">⚙️</span>
              <h1 className="text-xl font-bold tracking-tight text-[#3A0F34] dark:text-[#f6f1f7]">
                System Settings &amp; Administration
              </h1>
              <Badge variant="primary">7 Configuration Tools</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#bdaec2] mt-1 pl-1">
              Configure data pipelines, medication catalogs, international typography, security protocols, and governance.
            </p>
          </div>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 overflow-x-auto py-1">
          {SETTINGS_NAV.map((nav) => {
            const isCurrent = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => handleTabChange(nav.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? "neu-inset text-[#EAAA00] font-bold"
                    : "neu-btn text-slate-600 dark:text-slate-300 hover:text-[#3A0F34] dark:hover:text-[#f6f1f7]"
                }`}
              >
                <span>{nav.icon}</span>
                <span>{nav.label}</span>
                {nav.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      isCurrent
                        ? "bg-[#EAAA00]/25 text-[#EAAA00]"
                        : "bg-slate-200 dark:bg-[#2b122f] text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {nav.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected Setting Module */}
      <div className="pt-1">
        {activeTab === "import" && (
          <ImportModule
            existingPatients={patients}
            onImportComplete={(newRows) => {
              setPatients((prev) => [...newRows, ...prev]);
            }}
            importHistory={history}
            onAddHistory={(rec) => setHistory((prev) => [rec, ...prev])}
          />
        )}

        {activeTab === "export" && (
          <ExportModule
            patients={patients}
            treatments={treatments}
            exportHistory={history}
            onAddHistory={(rec) => setHistory((prev) => [rec, ...prev])}
          />
        )}

        {activeTab === "history" && <HistoryModule history={history} />}

        {activeTab === "injections" && (
          <InjectionsCatalog
            injections={injections}
            setInjections={setInjections}
            isLiveDb={isLiveDb}
          />
        )}

        {activeTab === "typography" && <TypographyStudio />}

        {activeTab === "roles" && <RolesModule isLiveDb={isLiveDb} />}

        {activeTab === "security" && <SecurityAuditModule />}
      </div>
    </div>
  );
}
