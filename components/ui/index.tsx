"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

// Backward-compatible CSS classes for existing components
export const inputCls =
  "w-full rounded-xl neu-inset bg-[#d8dee3] dark:bg-[#180a1a] px-3.5 py-2.5 text-sm text-[#3A0F34] dark:text-[#f6f1f7] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#EAAA00] transition-all";

export const btnCls =
  "inline-flex items-center justify-center gap-2 rounded-xl neu-btn bg-[#EAAA00] text-[#190617] font-semibold px-4 py-2.5 text-sm hover:bg-[#d49a00] active:neu-btn-pressed transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm cursor-pointer";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl neu-btn bg-[#DDE3E8] dark:bg-[#200f23] text-[#3A0F34] dark:text-[#f6f1f7] px-3.5 py-2 text-sm hover:bg-[#d5dbe0] dark:hover:bg-[#28132c] active:neu-btn-pressed transition-all cursor-pointer";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl neu-btn bg-[#DDE3E8] dark:bg-[#251229] text-[#3A0F34] dark:text-[#f6f1f7] border border-white/60 dark:border-[#3d1c43] px-4 py-2.5 text-sm font-medium hover:text-[#EAAA00] active:neu-btn-pressed transition-all cursor-pointer";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl neu-btn bg-rose-600 text-white px-4 py-2 text-sm font-medium hover:bg-rose-700 active:neu-btn-pressed transition-all cursor-pointer";

// Toast context for notifications
export type ToastType = "success" | "error" | "info" | "warning";
export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

const ToastContext = createContext<{
  toasts: ToastMessage[];
  addToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl p-4 neu-card neu-card-hover border-l-4 transition-all animate-in slide-in-from-right ${
              t.type === "success"
                ? "border-emerald-500"
                : t.type === "error"
                  ? "border-rose-500"
                  : t.type === "warning"
                    ? "border-[#EAAA00]"
                    : "border-sky-500"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-[#3A0F34] dark:text-[#f6f1f7]">
                  {t.title}
                </p>
                {t.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// 1. Neumorphic Card
export function Card({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`neu-card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-white/50 dark:border-[#38163f]/60">
          <div>
            {typeof title === "string" ? (
              <h2 className="text-base font-bold text-[#3A0F34] dark:text-[#f6f1f7] tracking-tight">
                {title}
              </h2>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-[#bdaec2] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// 2. Inset Card (for recessed internal areas)
export function CardInset({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`neu-inset p-4 ${className}`}>{children}</div>;
}

// 3. Neumorphic KPI Statistic Card
export function Kpi({
  label,
  value,
  hint,
  icon,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  trend?: { val: string; positive?: boolean };
}) {
  return (
    <div className="neu-card neu-card-hover p-4 flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative accent sliver */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EAAA00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-[#bdaec2] line-clamp-1">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-xl neu-inset text-[#EAAA00] flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-bold tabular-nums text-[#3A0F34] dark:text-[#f6f1f7] tracking-tight">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              trend.positive
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            }`}
          >
            {trend.val}
          </span>
        )}
      </div>

      {hint && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
          {hint}
        </div>
      )}
    </div>
  );
}

// 4. Accessible Neumorphic Form Label
export function Label({
  text,
  children,
  required,
  hint,
  className = "",
}: {
  text: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-[#3A0F34] dark:text-[#e4dbe7]">
          {text}{" "}
          {required && <span className="text-[#EAAA00] font-bold">*</span>}
        </span>
        {hint && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

// 5. Neumorphic Badge
export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "primary" | "success" | "warning" | "danger" | "purple";
  size?: "sm" | "md";
  className?: string;
}) {
  const styles = {
    neutral:
      "bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700",
    primary:
      "bg-[#EAAA00]/20 text-[#8c6600] dark:bg-[#EAAA00]/15 dark:text-[#EAAA00] border border-[#EAAA00]/40",
    success:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800",
    warning:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800",
    danger:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800",
    purple:
      "bg-[#3A0F34]/15 text-[#3A0F34] dark:bg-[#54194c]/40 dark:text-[#f6f1f7] border border-[#3A0F34]/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-center font-medium rounded-full ${styles[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}

// 6. Glassmorphic Modal Dialog
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#150917]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxWidth} neu-card p-6 border border-white/60 dark:border-[#54194c]/50 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/60 dark:border-[#38163f]">
          <div className="text-lg font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
            {title}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 neu-btn text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// 7. Neumorphic Segmented Tabs
export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="neu-inset p-1.5 inline-flex flex-wrap gap-1 rounded-2xl">
      {tabs.map((tab) => {
        const isSelected = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isSelected
                ? "neu-btn bg-[#EAAA00] text-[#190617] shadow-sm font-bold"
                : "text-slate-600 dark:text-slate-300 hover:text-[#3A0F34] dark:hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// 8. Universal Bulk Upload & Download Modals
export { BulkUploadModal, BulkDownloadModal } from "./BulkModal";
export { default as OfflineBanner } from "./OfflineBanner";
