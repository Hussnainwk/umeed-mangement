"use client";
import React, { useState, useCallback, memo } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Syringe,
  Settings2,
  Sun,
  Moon,
  Type,
  Plus,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShieldCheck,
  FileDown,
  FileUp,
  History,
  FlaskConical,
  PaletteIcon,
  UserCog,
} from "lucide-react";
import { Badge, useToast, btnCls, btnSecondary } from "@/components/ui";
import { useTheme, useTypography, useNav, AppView } from "@/context/providers";
import { useAuth } from "@/context/auth";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  matches?: AppView[];
}

interface SessionUser {
  name: string;
  email: string;
  role: string;
}

// ─── Nav Config ───────────────────────────────────────────────────────────────
const PRIMARY_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
  {
    id: "patients",
    label: "Patients",
    icon: <Users size={15} />,
    matches: ["patients", "patient_details"],
  },
  { id: "patients_new", label: "Register", icon: <UserPlus size={15} /> },
  { id: "treatments", label: "Treatments", icon: <Syringe size={15} /> },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings2 size={15} />,
    badge: "7",
    matches: [
      "settings",
      "import",
      "export",
      "history",
      "injections",
      "typography",
      "roles",
      "security",
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Single primary nav tab button */
const NavTabButton = memo(function NavTabButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={item.label}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAAA00] ${
        isActive
          ? "neu-inset text-[#EAAA00] font-bold scale-[1.02]"
          : "neu-btn text-slate-600 dark:text-slate-300 hover:text-[#3A0F34] dark:hover:text-[#f6f1f7] hover:scale-[1.01]"
      }`}
    >
      <span
        className={`flex-shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
      >
        {item.icon}
      </span>
      <span>{item.label}</span>
      {item.badge && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
            isActive
              ? "bg-[#EAAA00]/25 text-[#EAAA00]"
              : "bg-slate-200 dark:bg-[#2b122f] text-slate-500 dark:text-slate-400"
          }`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
});

/** Mobile drawer nav row */
const MobileNavRow = memo(function MobileNavRow({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
        isActive
          ? "neu-inset text-[#EAAA00]"
          : "neu-btn text-[#3A0F34] dark:text-[#f6f1f7]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex-shrink-0 ${isActive ? "text-[#EAAA00]" : "text-slate-500 dark:text-slate-400"}`}
        >
          {item.icon}
        </span>
        <span>{item.label}</span>
      </div>
      {item.badge && (
        <Badge variant="primary" size="sm">
          {item.badge}
        </Badge>
      )}
    </button>
  );
});

/** User avatar initials pill */
const UserAvatar = memo(function UserAvatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const sizeClass = size === "md" ? "w-10 h-10 text-sm" : "w-7 h-7 text-xs";
  return (
    <div
      className={`${sizeClass} rounded-xl neu-inset bg-[#3A0F34] dark:bg-[#54194c] text-[#EAAA00] font-bold flex items-center justify-center flex-shrink-0`}
    >
      {initials}
    </div>
  );
});

/** Header icon-button (theme toggle, settings shortcut, etc.) */
const HeaderIconButton = memo(function HeaderIconButton({
  onClick,
  title,
  children,
  className = "",
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`neu-btn p-2 rounded-xl flex items-center justify-center text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAAA00] ${className}`}
    >
      {children}
    </button>
  );
});

// ─── Footer quick-links config ────────────────────────────────────────────────
const FOOTER_LINKS: { id: AppView; label: string; icon: React.ReactNode }[] = [
  { id: "settings", label: "Settings", icon: <Settings2 size={13} /> },
  { id: "typography", label: "Typography", icon: <PaletteIcon size={13} /> },
  { id: "security", label: "Security", icon: <ShieldCheck size={13} /> },
  { id: "import", label: "Import", icon: <FileUp size={13} /> },
  { id: "export", label: "Export", icon: <FileDown size={13} /> },
  { id: "history", label: "History", icon: <History size={13} /> },
];

// ─── Shell ────────────────────────────────────────────────────────────────────
export default function Shell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { currentFont } = useTypography();
  const { activeView, setActiveView } = useNav();
  const { addToast } = useToast();
  const { user, signOut } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sessionUser = user
    ? { name: user.name, email: user.email, role: user.role }
    : null;

  const isItemActive = useCallback(
    (item: NavItem) =>
      item.matches ? item.matches.includes(activeView) : activeView === item.id,
    [activeView],
  );

  const handleNav = useCallback(
    (view: AppView) => {
      setActiveView(view);
      setMobileMenuOpen(false);
    },
    [setActiveView],
  );

  const handleSignOut = useCallback(async () => {
    setIsProfileOpen(false);
    await signOut();
    addToast("info", "Signed Out", "Session ended successfully.");
  }, [addToast, signOut]);

  return (
    <div className="min-h-screen bg-[#DDE3E8] dark:bg-[#150917] text-[#3A0F34] dark:text-[#f6f1f7] transition-colors duration-300">
      {/* ── TOP HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 px-4 py-3 glass-overlay border-b border-white/60 dark:border-[#3d1c43]/60">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <HeaderIconButton
              onClick={() => setMobileMenuOpen((v) => !v)}
              title="Toggle navigation menu"
              className="lg:hidden"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </HeaderIconButton>

            {/* Logo + wordmark */}
            <button
              onClick={() => handleNav("dashboard")}
              className="flex items-center gap-2.5 group focus-visible:outline-none"
            >
              <div className="w-10 h-10 rounded-xl neu-inset bg-gradient-to-br from-[#EAAA00] to-[#b88500] flex items-center justify-center shadow-sm p-1 overflow-hidden group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/logo.png"
                  alt="UMEED Logo"
                  width={36}
                  height={36}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-[#3A0F34] dark:text-[#f6f1f7] group-hover:text-[#EAAA00] transition-colors duration-200">
                    UMEED
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EAAA00]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md neu-inset text-[#3A0F34] dark:text-[#EAAA00]">
                    v2.5 Pro
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-[#bdaec2]">
                  Hemophilia Registry &amp; Clinical Intelligence
                </p>
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Settings shortcut */}
            <HeaderIconButton
              onClick={() => handleNav("settings")}
              title="Settings & Tools"
            >
              <Settings2 size={16} />
            </HeaderIconButton>

            {/* Typography */}
            <button
              onClick={() => handleNav("typography")}
              title="Typography Studio"
              className="neu-btn px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAAA00]"
            >
              <Type size={14} />
              <span className="hidden sm:inline font-mono text-[11px] font-bold leading-none">
                {currentFont}
              </span>
            </button>

            {/* Theme toggle */}
            <HeaderIconButton
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
              className="text-[#3A0F34] dark:text-[#EAAA00]"
            >
              {resolvedTheme === "dark" ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
            </HeaderIconButton>

            {/* New Patient CTA */}
            <button
              onClick={() => handleNav("patients_new")}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl neu-btn bg-[#EAAA00] text-[#190617] font-bold px-3.5 py-2 text-xs hover:bg-[#d49a00] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A0F34]"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>New Patient</span>
            </button>

            {/* User profile */}
            {sessionUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 border-l border-white/60 dark:border-[#3d1c43] ml-0.5 cursor-pointer focus-visible:outline-none"
                >
                  <div className="neu-btn px-1.5 sm:px-2.5 py-1 rounded-xl flex items-center gap-2 hover:scale-[1.02] transition-all duration-200">
                    <UserAvatar name={sessionUser.name} />
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-bold leading-none text-[#3A0F34] dark:text-[#f6f1f7]">
                        {sessionUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-[#bdaec2] leading-none mt-0.5">
                        {sessionUser.role}
                      </p>
                    </div>
                    <ChevronDown
                      size={12}
                      className={`hidden lg:block text-slate-400 transition-transform duration-200 ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Profile dropdown */}
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 w-72 neu-card p-4 border border-white/60 dark:border-[#54194c]/60 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Current user info */}
                      <div className="neu-inset p-3.5 rounded-xl flex items-center gap-3 mb-3">
                        <UserAvatar name={sessionUser.name} size="md" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#3A0F34] dark:text-[#f6f1f7] truncate">
                            {sessionUser.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {sessionUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="neu-inset px-3 py-2 rounded-xl mb-3 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          Assigned Role:
                        </span>
                        <Badge variant="primary" size="sm">
                          {sessionUser.role}
                        </Badge>
                      </div>

                      {/* Sign out */}
                      <div className="pt-2 border-t border-white/60 dark:border-[#38163f] flex justify-between items-center">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer font-medium"
                        >
                          <LogOut size={13} />
                          Sign Out
                        </button>
                        <button
                          onClick={() => setIsProfileOpen(false)}
                          className={btnSecondary + " !py-1.5 !px-3 !text-xs"}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={() => setIsProfileOpen(true)} className={btnCls}>
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* ── PRIMARY NAV TABS ────────────────────────────────────────────── */}
        <nav
          aria-label="Primary navigation"
          className="mx-auto max-w-7xl mt-2.5 hidden lg:flex items-center gap-2 overflow-x-auto py-1 scrollbar-none"
        >
          {PRIMARY_NAV.map((item) => (
            <NavTabButton
              key={item.id}
              item={item}
              isActive={isItemActive(item)}
              onClick={() => handleNav(item.id)}
            />
          ))}
        </nav>
      </header>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden mx-3 my-2 p-3 neu-card border border-white/60 dark:border-[#3d1c43]/60 space-y-1.5 animate-in slide-in-from-top-2 duration-200"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 mb-2">
            Navigation
          </p>
          {PRIMARY_NAV.map((item) => (
            <MobileNavRow
              key={item.id}
              item={item}
              isActive={isItemActive(item)}
              onClick={() => handleNav(item.id)}
            />
          ))}
        </nav>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 min-h-[82vh]">
        <Breadcrumbs />
        {children}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/50 dark:border-[#38163f]/60 py-5 px-4 text-xs text-slate-500 dark:text-[#bdaec2]">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Powered by
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>Hussnain</span>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-3"
          >
            {FOOTER_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveView(link.id)}
                className="flex items-center gap-1 hover:text-[#EAAA00] transition-colors duration-200 cursor-pointer"
              >
                {link.icon}
                {link.label}
              </button>
            ))}
          </nav>

          <span>© {new Date().getFullYear()} Umeed Welfare Foundation</span>
        </div>
      </footer>
    </div>
  );
}
