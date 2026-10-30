"use client";
import React from "react";
import { Card, Badge } from "@/components/ui";
import { HistoryRecord } from "@/data/mockData";

interface HistoryModuleProps {
  history: HistoryRecord[];
}

export default function HistoryModule({ history }: HistoryModuleProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card
        title="Batch Ingestion &amp; Export Audit Log"
        subtitle="Immutable operational record of all batch spreadsheet transactions:"
      >
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-white/60 dark:border-[#38163f]">
              <tr>
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="px-3">Operation</th>
                <th className="px-3">File Name</th>
                <th className="px-3">Format</th>
                <th className="px-3">Rows</th>
                <th className="px-3">Success</th>
                <th className="px-3">Status</th>
                <th className="px-3">Timestamp</th>
                <th className="px-3">Operator</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr
                  key={h.id}
                  className="border-t border-slate-200/50 dark:border-[#2d1433]"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-[#EAAA00]">
                    {h.id}
                  </td>
                  <td className="px-3">
                    <Badge
                      variant={h.type === "import" ? "primary" : "purple"}
                      size="sm"
                    >
                      {h.type.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-3 font-semibold">{h.filename}</td>
                  <td className="px-3 uppercase font-mono">{h.format}</td>
                  <td className="px-3 tabular-nums font-bold">{h.records_count}</td>
                  <td className="px-3 tabular-nums text-emerald-600 font-bold">
                    {h.success_count}
                  </td>
                  <td className="px-3">
                    <Badge
                      variant={
                        h.status === "Completed"
                          ? "success"
                          : h.status === "Partial"
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                    >
                      {h.status}
                    </Badge>
                  </td>
                  <td className="px-3 text-slate-500">{h.timestamp}</td>
                  <td className="px-3">{h.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
