"use client";
import React, { memo } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  User,
  Syringe,
  Settings2,
  FileUp,
  FileDown,
  History,
  FlaskConical,
  Palette,
  ShieldCheck,
  UserCog,
  ChevronRight,
} from "lucide-react";
import { useNav, AppView } from "@/context/providers";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Crumb {
  label: string;
  icon: React.ReactNode;
  view?: AppView;
  active?: boolean;
}

interface BreadcrumbsProps {
  patientName?: string;
  patientRegNo?: string;
}

// ─── Icon map ──────────────────────────────────────────────────────────────────
const ICON_SIZE = 13;
const ICONS = {
  dashboard: <LayoutDashboard size={ICON_SIZE} />,
  patients: <Users size={ICON_SIZE} />,
  patients_new: <UserPlus size={ICON_SIZE} />,
  patient: <User size={ICON_SIZE} />,
  treatments: <Syringe size={ICON_SIZE} />,
  settings: <Settings2 size={ICON_SIZE} />,
  import: <FileUp size={ICON_SIZE} />,
  export: <FileDown size={ICON_SIZE} />,
  history: <History size={ICON_SIZE} />,
  injections: <FlaskConical size={ICON_SIZE} />,
  typography: <Palette size={ICON_SIZE} />,
  roles: <UserCog size={ICON_SIZE} />,
  security: <ShieldCheck size={ICON_SIZE} />,
};

// ─── Crumb factory ─────────────────────────────────────────────────────────────
function buildCrumbs(activeView: AppView, patientName?: string, patientRegNo?: string): Crumb[] {
  const home: Crumb = { label: "Dashboard", icon: ICONS.dashboard, view: "dashboard" };
  const settings: Crumb = { label: "Settings", icon: ICONS.settings, view: "settings" };

  switch (activeView) {
    case "dashboard":
      return [{ ...home, active: true }];
    case "patients":
      return [home, { label: "Patients", icon: ICONS.patients, active: true }];
    case "patients_new":
      return [home, { label: "Patients", icon: ICONS.patients, view: "patients" }, { label: "Register Patient", icon: ICONS.patients_new, active: true }];
    case "patient_details":
      return [
        home,
        { label: "Patients", icon: ICONS.patients, view: "patients" },
        {
          label: patientRegNo ? `${patientRegNo}${patientName ? ` · ${patientName}` : ""}` : "Patient Profile",
          icon: ICONS.patient,
          active: true,
        },
      ];
    case "treatments":
      return [home, { label: "Treatments Log", icon: ICONS.treatments, active: true }];
    case "settings":
      return [home, { ...settings, active: true }];
    case "import":
      return [home, settings, { label: "Batch Import", icon: ICONS.import, active: true }];
    case "export":
      return [home, settings, { label: "Export Data", icon: ICONS.export, active: true }];
    case "history":
      return [home, settings, { label: "Audit History", icon: ICONS.history, active: true }];
    case "injections":
      return [home, settings, { label: "Injections Catalog", icon: ICONS.injections, active: true }];
    case "typography":
      return [home, settings, { label: "Typography Studio", icon: ICONS.typography, active: true }];
    case "roles":
      return [home, settings, { label: "Roles & Permissions", icon: ICONS.roles, active: true }];
    case "security":
      return [home, settings, { label: "Security Audit", icon: ICONS.security, active: true }];
    default:
      return [home];
  }
}

// ─── CrumbItem ─────────────────────────────────────────────────────────────────
const CrumbItem = memo(function CrumbItem({
  crumb,
  isLast,
  onNavigate,
}: {
  crumb: Crumb;
  isLast: boolean;
  onNavigate: (view: AppView) => void;
}) {
  const baseClass = "flex items-center gap-1.5";

  if (crumb.active || !crumb.view) {
    return (
      <span
        className={`${baseClass} font-bold text-[#EAAA00]`}
        aria-current={isLast ? "page" : undefined}
      >
        <span className="flex-shrink-0 opacity-90">{crumb.icon}</span>
        <span>{crumb.label}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => crumb.view && onNavigate(crumb.view)}
      className={`${baseClass} text-slate-600 dark:text-slate-400 hover:text-[#3A0F34] dark:hover:text-[#f6f1f7] transition-colors duration-150 cursor-pointer group`}
    >
      <span className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        {crumb.icon}
      </span>
      <span className="group-hover:underline underline-offset-2">{crumb.label}</span>
    </button>
  );
});

// ─── Breadcrumbs ───────────────────────────────────────────────────────────────
export default memo(function Breadcrumbs({ patientName, patientRegNo }: BreadcrumbsProps) {
  const { activeView, setActiveView } = useNav();
  const crumbs = buildCrumbs(activeView, patientName, patientRegNo);

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl neu-inset text-xs font-medium"
    >
      <ol className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1 sm:gap-1.5">
              {idx > 0 && (
                <ChevronRight
                  size={11}
                  className="text-slate-400 dark:text-slate-600 flex-shrink-0"
                  aria-hidden
                />
              )}
              <CrumbItem
                crumb={crumb}
                isLast={isLast}
                onNavigate={setActiveView}
              />
            </li>
          );
        })}
      </ol>

      <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>PHPWS Hemophilia Registry</span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span className="font-mono text-[#EAAA00] font-semibold">DataMangement v2.5</span>
      </div>
    </nav>
  );
});
