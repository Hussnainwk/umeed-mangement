"use client";
import React, { useState, useEffect } from "react";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Clock,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Modal, Badge, btnCls, btnSecondary, btnDanger, useToast } from "@/components/ui";
import { useOnlineStatus, useOfflineQueue, OfflineQueueItem } from "@/lib/offlineQueue";
import { syncOfflineQueueItem } from "@/lib/dataService";

interface OfflineBannerProps {
  isLiveDb: boolean;
  onSyncComplete?: () => void;
}

export default function OfflineBanner({ isLiveDb, onSyncComplete }: OfflineBannerProps) {
  const isOnline = useOnlineStatus();
  const { queue, pendingCount, removeItem, clearAll, refresh } = useOfflineQueue();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSyncingId, setActiveSyncingId] = useState<string | null>(null);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      handleSyncAll();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSyncAll = async () => {
    if (queue.length === 0 || isSyncing) return;
    setIsSyncing(true);

    let successCount = 0;
    let failedCount = 0;

    for (const item of [...queue]) {
      setActiveSyncingId(item.id);
      const res = await syncOfflineQueueItem(item, isLiveDb);
      if (res.success) {
        removeItem(item.id);
        successCount++;
      } else {
        failedCount++;
      }
    }

    setActiveSyncingId(null);
    setIsSyncing(false);
    refresh();

    if (successCount > 0) {
      addToast(
        "success",
        "Offline Uploads Synced",
        `Successfully synced ${successCount} offline file(s) into database.`
      );
      if (onSyncComplete) onSyncComplete();
    }

    if (failedCount > 0) {
      addToast(
        "warning",
        "Sync Incomplete",
        `${failedCount} item(s) could not be synchronized yet. Kept in offline queue.`
      );
    }
  };

  const handleSyncSingle = async (item: OfflineQueueItem) => {
    setActiveSyncingId(item.id);
    const res = await syncOfflineQueueItem(item, isLiveDb);
    setActiveSyncingId(null);

    if (res.success) {
      removeItem(item.id);
      addToast("success", "Item Synced", `Successfully synced ${item.filename} to database.`);
      if (onSyncComplete) onSyncComplete();
    } else {
      addToast("error", "Sync Failed", res.error || "Could not push to database.");
    }
  };

  // If online and queue is empty, do not show banner
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <>
      <div className="neu-card p-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 text-xs border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/5">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
              <WifiOff size={15} className="animate-pulse" />
              <span>Offline Mode Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
              <Wifi size={15} />
              <span>Back Online</span>
            </div>
          )}

          <span className="text-slate-400 dark:text-slate-600">|</span>

          {pendingCount > 0 ? (
            <span className="text-slate-700 dark:text-slate-200">
              <strong>{pendingCount} file(s)</strong> stored locally in offline queue
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              Bulk uploads &amp; entries will save locally and sync when reconnected.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-2.5 py-1 rounded-lg neu-btn text-xs font-semibold hover:text-[#EAAA00] cursor-pointer"
              >
                View Queue ({pendingCount})
              </button>

              <button
                type="button"
                onClick={handleSyncAll}
                disabled={!isOnline || isSyncing}
                className="px-3 py-1 rounded-lg neu-btn bg-[#EAAA00] text-[#190617] font-bold text-xs flex items-center gap-1.5 hover:bg-[#d49a00] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                <span>{isSyncing ? "Syncing…" : "Sync Now to Database"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Offline Queue Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Offline Pending Uploads Queue"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-[#bdaec2]">
            These files were uploaded while disconnected or waiting for network stabilization. They will be pushed to the database as soon as you trigger sync.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {queue.map((item) => (
              <div
                key={item.id}
                className="neu-inset p-3 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg neu-card flex items-center justify-center text-[#EAAA00] flex-shrink-0">
                    {item.format === "xlsx" ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#3A0F34] dark:text-[#f6f1f7] truncate">
                      {item.filename}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="capitalize font-semibold text-[#EAAA00]">{item.entityType}</span>
                      <span>·</span>
                      <span>{item.recordCount} rows</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSyncSingle(item)}
                    disabled={!isOnline || activeSyncingId === item.id}
                    title="Sync this item"
                    className="p-1.5 rounded-lg neu-btn hover:text-emerald-500 cursor-pointer disabled:opacity-40"
                  >
                    <UploadCloud
                      size={14}
                      className={activeSyncingId === item.id ? "animate-bounce" : ""}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    title="Remove from queue"
                    className="p-1.5 rounded-lg neu-btn text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/60 dark:border-[#38163f]">
            <button
              type="button"
              onClick={clearAll}
              className="text-rose-500 hover:underline cursor-pointer text-xs"
            >
              Clear Entire Queue
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={btnSecondary}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSyncAll}
                disabled={!isOnline || isSyncing}
                className={`${btnCls} flex items-center gap-1.5`}
              >
                <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                <span>{isSyncing ? "Syncing All…" : "Sync All to Database"}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

