"use client";
import { useState, useEffect, useCallback } from "react";

export type OfflineEntityType = "patients" | "treatments" | "injections" | "users";

export interface OfflineQueueItem {
  id: string;
  entityType: OfflineEntityType;
  filename: string;
  format: "xlsx" | "csv";
  rows: Record<string, any>[];
  recordCount: number;
  timestamp: string;
  status: "pending" | "syncing" | "failed";
  error?: string;
}

const STORAGE_KEY = "umeed_offline_upload_queue";

// Read from storage
export function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save to storage
export function saveOfflineQueue(items: OfflineQueueItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("umeed_offline_queue_changed"));
  } catch (err) {
    console.error("Failed to persist offline queue:", err);
  }
}

// Add item to queue
export function enqueueOfflineUpload(
  entityType: OfflineEntityType,
  filename: string,
  format: "xlsx" | "csv",
  rows: Record<string, any>[]
): OfflineQueueItem {
  const current = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    entityType,
    filename,
    format,
    rows,
    recordCount: rows.length,
    timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
    status: "pending",
  };
  current.unshift(newItem);
  saveOfflineQueue(current);
  return newItem;
}

// Remove item from queue
export function removeOfflineQueueItem(id: string) {
  const current = getOfflineQueue();
  const filtered = current.filter((item) => item.id !== id);
  saveOfflineQueue(filtered);
}

// Clear all items
export function clearOfflineQueue() {
  saveOfflineQueue([]);
}

/**
 * Hook to track online / offline state
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * React hook to manage and interact with the offline sync queue
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);

  const refresh = useCallback(() => {
    setQueue(getOfflineQueue());
  }, []);

  useEffect(() => {
    refresh();
    const handleStorage = () => refresh();
    window.addEventListener("umeed_offline_queue_changed", handleStorage);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("umeed_offline_queue_changed", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  return {
    queue,
    pendingCount: queue.length,
    refresh,
    removeItem: (id: string) => {
      removeOfflineQueueItem(id);
      refresh();
    },
    clearAll: () => {
      clearOfflineQueue();
      refresh();
    },
  };
}

