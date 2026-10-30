"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";
import Shell from "@/components/layout/Shell";
import LoginPage from "@/components/auth/LoginPage";
import Image from "next/image";

/**
 * AppShell: Auth gate.
 * - Loading  → full-screen spinner
 * - No user  → LoginPage (no Shell rendered at all)
 * - User     → Shell + children
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#DDE3E8] dark:bg-[#150917] flex flex-col items-center justify-center gap-4 transition-colors">
        <div className="w-16 h-16 rounded-2xl neu-card bg-gradient-to-br from-[#EAAA00] to-[#b88500] flex items-center justify-center shadow-lg p-2 overflow-hidden">
          <Image
            src="/logo.png"
            alt="UMEED Logo"
            width={64}
            height={64}
            unoptimized
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <Loader2 size={22} className="animate-spin text-[#EAAA00]" />
        <p className="text-xs text-slate-500 dark:text-[#bdaec2]">
          Initialising session…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Shell>{children}</Shell>;
}
