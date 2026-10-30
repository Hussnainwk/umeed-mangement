"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { recordLoginAttempt, recordAuditLog } from "@/lib/dataService";
import type { Session, User } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  department?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const ACTIVE_SESSION_STORAGE_KEY = "befal_auth_session";
const REGISTERED_USERS_STORAGE_KEY = "befal_registered_users";

// Default authorized administrative accounts (in-memory / fallback)
const INITIAL_SUPER_ADMIN = {
  id: "usr-admin-001",
  email: "admin@umeed.org",
  password: "Password123!",
  fullName: "Dr. Hammad (Lead Administrator)",
  role: "super_admin",
  status: "active",
};

const INITIAL_CLINICIAN = {
  id: "usr-clinician-002",
  email: "clinician@umeed.org",
  password: "Password123!",
  fullName: "Staff Clinician",
  role: "clinician",
  status: "active",
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

// ─── Helper: map Supabase User → AuthUser ─────────────────────────────────────
function mapSupabaseUser(
  user: User,
  dbRole?: string,
  dbName?: string,
): AuthUser {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    name:
      dbName || meta.full_name || meta.name || user.email || "Clinical Officer",
    role: dbRole || meta.role || "clinician",
    status: "active",
  };
}

// ─── Helper: Get local user registry ──────────────────────────────────────────
function getStoredAuthorizedUsers(): any[] {
  if (typeof window === "undefined")
    return [INITIAL_SUPER_ADMIN, INITIAL_CLINICIAN];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        REGISTERED_USERS_STORAGE_KEY,
        JSON.stringify([INITIAL_SUPER_ADMIN, INITIAL_CLINICIAN]),
      );
      return [INITIAL_SUPER_ADMIN, INITIAL_CLINICIAN];
    }
    return JSON.parse(raw);
  } catch {
    return [INITIAL_SUPER_ADMIN, INITIAL_CLINICIAN];
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on mount
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      // 1. Check local session storage first
      try {
        const localRaw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        if (localRaw) {
          const storedUser: AuthUser = JSON.parse(localRaw);
          if (!cancelled && storedUser && storedUser.email) {
            setUser(storedUser);
            setLoading(false);
            return;
          }
        }
      } catch {
        // continue
      }

      // 2. Check Supabase auth session
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.auth.getSession();
          if (!cancelled && data.session) {
            setSession(data.session);
            setUser(mapSupabaseUser(data.session.user));
          }
        } catch {
          // Supabase session unavailable
        }
      }

      if (!cancelled) setLoading(false);
    }

    restoreSession();

    // Listen to Supabase auth events
    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((_event, sess) => {
        if (cancelled) return;
        if (sess) {
          setSession(sess);
          const mapped = mapSupabaseUser(sess.user);
          setUser(mapped);
          localStorage.setItem(
            ACTIVE_SESSION_STORAGE_KEY,
            JSON.stringify(mapped),
          );
        }
        setLoading(false);
      });
      subscription = data.subscription;
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  // ── Strict Sign In (Supabase Auth First -> DB Profile -> Local Fallback) ──
  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Supabase Authentication First
    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

        // Supabase Auth succeeded: User is now authenticated with a valid token
        if (!authError && authData?.session) {
          // Now that user is authenticated, RLS allows querying public.users
          const { data: dbUser } = await supabase
            .from("users")
            .select("id, email, full_name, role, status")
            .eq("email", normalizedEmail)
            .maybeSingle();

          // Check if DB explicitly marked user as inactive / suspended
          if (dbUser && dbUser.status && dbUser.status !== "active") {
            await supabase.auth.signOut();
            await recordLoginAttempt(normalizedEmail, false);
            await recordAuditLog({
              user_id: dbUser.id,
              user_email: normalizedEmail,
              action: "LOGIN_SUSPENDED",
              resource: "/auth/login",
              status: "blocked",
              details: `User status is '${dbUser.status}'. Denied entry.`,
            });
            return {
              error: `Access Denied: Account status is '${dbUser.status}'. Contact system administrator.`,
            };
          }

          setSession(authData.session);
          const mapped = mapSupabaseUser(
            authData.session.user,
            dbUser?.role,
            dbUser?.full_name,
          );
          setUser(mapped);
          localStorage.setItem(
            ACTIVE_SESSION_STORAGE_KEY,
            JSON.stringify(mapped),
          );

          // Log success & update last_login
          await recordLoginAttempt(normalizedEmail, true);
          await recordAuditLog({
            user_id: dbUser?.id || authData.session.user.id,
            user_email: normalizedEmail,
            action: "LOGIN_SUCCESS",
            resource: "/auth/login",
            status: "success",
            details: "Successful authenticated login to UMEED Registry.",
          });

          // Update last_login in users table if available
          supabase
            .from("users")
            .update({ last_login: new Date().toISOString() })
            .eq("email", normalizedEmail)
            .then();

          return {};
        }

        // If Supabase Auth failed with an explicit error (other than invalid login), log notice
        if (authError && authError.message !== "Invalid login credentials") {
          console.warn("Supabase Auth sign-in warning:", authError.message);
        }
      } catch (err: any) {
        console.warn("Database login verification error:", err);
      }
    }

    // 2. Pre-authorized Local Fallback Verification (Controlled database credentials)
    const registeredList = getStoredAuthorizedUsers();
    const matched = registeredList.find(
      (u) =>
        u.email.toLowerCase() === normalizedEmail && u.password === password,
    );

    if (matched) {
      if (matched.status && matched.status !== "active") {
        return {
          error: `Access Denied: Account status is '${matched.status}'. Contact system administrator.`,
        };
      }

      const authUser: AuthUser = {
        id: matched.id || `usr-${Date.now()}`,
        email: matched.email,
        name: matched.fullName,
        role: matched.role || "clinician",
        status: matched.status || "active",
      };
      setUser(authUser);
      localStorage.setItem(
        ACTIVE_SESSION_STORAGE_KEY,
        JSON.stringify(authUser),
      );

      await recordLoginAttempt(normalizedEmail, true);
      await recordAuditLog({
        user_id: authUser.id,
        user_email: normalizedEmail,
        action: "LOGIN_SUCCESS",
        resource: "/auth/login",
        status: "success",
        details: "Authenticated via pre-authorized credentials.",
      });

      return {};
    }

    await recordLoginAttempt(normalizedEmail, false);
    await recordAuditLog({
      user_email: normalizedEmail,
      action: "LOGIN_FAILED",
      resource: "/auth/login",
      status: "failure",
      details: "Invalid email or password attempt.",
    });

    return {
      error:
        "Access Denied: Invalid email or password. Only pre-authorized database personnel are granted access.",
    };
  }, []);

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
