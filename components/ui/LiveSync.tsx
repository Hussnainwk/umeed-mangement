"use client";

/**
 * LiveSync — Supabase Realtime subscription component
 *
 * Mounts once (inside QueryClientProvider in Providers) and listens to
 * postgres_changes on `patients`, `treatments`, and `injections` tables.
 *
 * On any INSERT / UPDATE / DELETE it:
 *  1. Dispatches a custom browser event ("umeed:db-change") so page.tsx
 *     can call loadData() to refresh its state.
 *  2. Invalidates TanStack React Query caches (for future query-based hooks).
 *
 * Prerequisites in Supabase Dashboard:
 *  - Database → Replication → supabase_realtime publication must include
 *    the `patients`, `treatments`, and `injections` tables.
 *  - RLS SELECT policies must allow authenticated users to read those tables.
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const DB_CHANGE_EVENT = "umeed:db-change" as const;

export type DbChangePayload = {
  table: "patients" | "treatments" | "injections";
  eventType: "INSERT" | "UPDATE" | "DELETE";
};

/** Dispatch a browser CustomEvent so other components (e.g. page.tsx) can react. */
function dispatchDbChange(payload: DbChangePayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: payload }));
}

export default function LiveSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Do nothing if Supabase is not configured (local / demo mode)
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel("umeed-hospital-live")

      // ── Patients ──────────────────────────────────────────────────────────
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["patients"] });
          dispatchDbChange({
            table: "patients",
            eventType: payload.eventType as DbChangePayload["eventType"],
          });
        }
      )

      // ── Treatments ────────────────────────────────────────────────────────
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "treatments" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["treatments"] });
          dispatchDbChange({
            table: "treatments",
            eventType: payload.eventType as DbChangePayload["eventType"],
          });
        }
      )

      // ── Injections ────────────────────────────────────────────────────────
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "injections" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["injections"] });
          dispatchDbChange({
            table: "injections",
            eventType: payload.eventType as DbChangePayload["eventType"],
          });
        }
      )

      .subscribe((status) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[LiveSync] Realtime channel status:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Renders nothing — purely a side-effect component
  return null;
}

