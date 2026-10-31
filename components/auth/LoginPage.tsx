"use client";
import React, { useState, useCallback } from "react";
import Image from "next/image";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Database,
  Wifi,
  WifiOff,
  LockKeyhole,
} from "lucide-react";
import { useAuth } from "@/context/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ui";

// ─── Input ────────────────────────────────────────────────────────────────────
function AuthInput({
  type,
  placeholder,
  value,
  onChange,
  icon,
  suffix,
  disabled,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  suffix?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl neu-inset bg-[#d8dee3] dark:bg-[#180a1a] pl-10 pr-10 py-3 text-sm text-[#3A0F34] dark:text-[#f6f1f7] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#EAAA00] transition-all disabled:opacity-50"
      />
      {suffix && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── LoginPage (Strict Database User Access Only — No Public Registration) ───
export default function LoginPage() {
  const { signIn } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!email.trim() || !password.trim()) {
        setError("Both email and password are required.");
        return;
      }

      setLoading(true);
      const result = await signIn(email, password);
      setLoading(false);

      if (result.error) {
        setError(result.error);
      } else {
        addToast(
          "success",
          "Access Granted",
          "Welcome to UMEED Clinical Registry.",
        );
      }
    },
    [email, password, signIn, addToast],
  );

  return (
    <div className="min-h-screen bg-[#DDE3E8] dark:bg-[#150917] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md space-y-5 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl neu-card bg-gradient-to-br from-[#EAAA00] to-[#b88500] flex items-center justify-center shadow-lg p-2 overflow-hidden">
              <Image
                src="/logo.png"
                alt="UMEED Logo"
                width={56}
                height={56}
                unoptimized
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3A0F34] dark:text-[#f6f1f7]">
            UMEED Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#bdaec2]">
            Hemophilia Clinical Registry &amp; Intelligence — UWF
          </p>
        </div>

        {/* Database Connection Status Bar */}
        <div
          className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium neu-inset ${
            isSupabaseConfigured
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-amber-700 dark:text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <>
                <Wifi size={13} className="flex-shrink-0" />
                <Database size={13} className="flex-shrink-0" />
                <span> Live DB Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="flex-shrink-0" />
                <span>Local Clinical Registry Active</span>
              </>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            Secure Portal
          </span>
        </div>

        {/* Auth Form Card */}
        <div className="neu-card p-6 border border-white/60 dark:border-[#54194c]/50">
          {/* Secure Access Banner */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl neu-inset mb-5 text-[#3A0F34] dark:text-[#f6f1f7]">
            <LockKeyhole size={16} className="text-[#EAAA00] flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Restricted Access</span>
              <p className="text-[11px] text-slate-500 dark:text-[#bdaec2]">
                Only authorized database users can sign in.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {/* Email Address */}
              <AuthInput
                type="email"
                placeholder=" Authorized Email"
                value={email}
                onChange={setEmail}
                icon={<Mail size={15} />}
                disabled={loading}
              />

              {/* Password */}
              <AuthInput
                type={showPw ? "text" : "password"}
                placeholder="Enter Secure Password"
                value={password}
                onChange={setPassword}
                icon={<Lock size={15} />}
                disabled={loading}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 neu-inset px-3 py-2.5 rounded-xl">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl neu-btn bg-[#EAAA00] text-[#190617] font-bold py-3 text-sm hover:bg-[#d49a00] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? "Verifying Credentials…" : "Sign In to Registry"}
            </button>
          </form>

          {/* Clinical governance security footer */}
          <div className="pt-4 mt-4 border-t border-white/60 dark:border-[#38163f] text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>
                Protected Health Information (PHI) — 256-bit encryption
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Need access? Contact your Umeed Foundation Administrator to
              provision an account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
          Umeed Welfare Foundation (Hemophilia) · UMEED v2.5 Pro
        </p>
      </div>
    </div>
  );
}
