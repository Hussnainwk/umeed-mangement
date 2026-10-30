"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui";
import { AuthProvider } from "@/context/auth";
import LiveSync from "@/components/ui/LiveSync";

// ─── Theme Context ────────────────────────────────────────────────────────────
export type ThemeMode = "light" | "dark" | "system";

export interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ─── Typography Context ───────────────────────────────────────────────────────
export interface TypographyContextType {
  currentFont: string;
  currentWeight: number;
  setFont: (font: string) => void;
  setWeight: (weight: number) => void;
}

const TypographyContext = createContext<TypographyContextType>({
  currentFont: "Manrope",
  currentWeight: 500,
  setFont: () => {},
  setWeight: () => {},
});

export const useTypography = () => useContext(TypographyContext);

// ─── Navigation / View Context ────────────────────────────────────────────────
export type AppView =
  | "dashboard"
  | "patients"
  | "patients_new"
  | "patient_details"
  | "treatments"
  | "injections"
  | "import"
  | "export"
  | "history"
  | "typography"
  | "roles"
  | "security"
  | "settings";

export const VALID_VIEWS: AppView[] = [
  "dashboard",
  "patients",
  "patients_new",
  "patient_details",
  "treatments",
  "injections",
  "import",
  "export",
  "history",
  "typography",
  "roles",
  "security",
  "settings",
];

export interface NavContextType {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedPatientId: number | null;
  setSelectedPatientId: (id: number | null) => void;
}

const NavContext = createContext<NavContextType>({
  activeView: "dashboard",
  setActiveView: () => {},
  selectedPatientId: null,
  setSelectedPatientId: () => {},
});

export const useNav = () => useContext(NavContext);

// ─── Root Providers Component ─────────────────────────────────────────────────
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  );

  // 1. Theme
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = (localStorage.getItem("befal_theme") as ThemeMode) || "light";
    setThemeState(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const effective: "light" | "dark" =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    setResolvedTheme(effective);
    root.classList.toggle("dark", effective === "dark");
    localStorage.setItem("befal_theme", theme);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => setThemeState(mode), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    []
  );

  // 2. Typography
  const [currentFont, setCurrentFontState] = useState("Manrope");
  const [currentWeight, setCurrentWeightState] = useState(500);

  const applyFontVariables = useCallback((font: string, weight: number) => {
    const root = document.documentElement;
    const fontValue = font.includes(" ") ? `'${font}', sans-serif` : `${font}, sans-serif`;
    root.style.setProperty("--font-active", fontValue);
    root.style.setProperty("--font-weight-active", String(weight));
    document.body.style.fontFamily = fontValue;
    document.body.style.fontWeight = String(weight);
  }, []);

  useEffect(() => {
    const savedFont = localStorage.getItem("befal_font") || "Manrope";
    const savedWeight = Number(localStorage.getItem("befal_weight")) || 500;
    setCurrentFontState(savedFont);
    setCurrentWeightState(savedWeight);
    applyFontVariables(savedFont, savedWeight);
  }, [applyFontVariables]);

  const setFont = useCallback(
    (font: string) => {
      setCurrentFontState(font);
      localStorage.setItem("befal_font", font);
      applyFontVariables(font, currentWeight);
    },
    [applyFontVariables, currentWeight]
  );

  const setWeight = useCallback(
    (weight: number) => {
      setCurrentWeightState(weight);
      localStorage.setItem("befal_weight", String(weight));
      applyFontVariables(currentFont, weight);
    },
    [applyFontVariables, currentFont]
  );

  // 3. Navigation
  const [activeView, setActiveViewState] = useState<AppView>("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const navigateToView = useCallback((view: AppView) => {
    setActiveViewState(view);
    if (typeof window !== "undefined") {
      window.location.hash = view;
    }
  }, []);

  // Hash-based routing sync
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as AppView;
      if (VALID_VIEWS.includes(hash)) {
        setActiveViewState(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* LiveSync: Supabase Realtime listener — mounts once at app level */}
      <LiveSync />
      <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
        <TypographyContext.Provider value={{ currentFont, currentWeight, setFont, setWeight }}>
          <NavContext.Provider
            value={{
              activeView,
              setActiveView: navigateToView,
              selectedPatientId,
              setSelectedPatientId,
            }}
          >
            <ToastProvider>
              <AuthProvider>{children}</AuthProvider>
            </ToastProvider>
          </NavContext.Provider>
        </TypographyContext.Provider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
