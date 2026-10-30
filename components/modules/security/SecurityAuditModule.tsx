"use client";
import React, { useState } from "react";
import { Card, CardInset, Badge, btnCls, btnGhost, useToast } from "@/components/ui";
import { INITIAL_AUDIT_LOGS, AuditRecord } from "@/data/mockData";

export default function SecurityAuditModule() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Simulated Brute Force & Rate Limiter Tester
  const [testAttempts, setTestAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const simulateFailedLogin = () => {
    if (isLocked) {
      addToast("error", "Source Locked Out", `Origin IP throttled. Try again in ${lockoutTimer}s.`);
      return;
    }

    const nextAttempts = testAttempts + 1;
    setTestAttempts(nextAttempts);

    if (nextAttempts >= 4) {
      setIsLocked(true);
      setLockoutTimer(30);
      const interval = setInterval(() => {
        setLockoutTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            setIsLocked(false);
            setTestAttempts(0);
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      // Add to audit logs
      const newLog: AuditRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
        user: "hacker@malicious.xyz",
        action: "BRUTE_FORCE_LOCKOUT_TRIGGERED",
        resource: "API /auth/login",
        status: "blocked",
        ip: "185.220.101.5",
        details: "Threshold exceeded: 4 consecutive failures. Progressive delay + IP throttle activated.",
      };
      setLogs((prev) => [newLog, ...prev]);
      addToast("error", "Rate Limiter Activated", "Suspicious login pattern detected. Temporary lockout enforced.");
    } else {
      const newLog: AuditRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
        user: "unknown",
        action: "FAILED_LOGIN_ATTEMPT",
        resource: "API /auth/login",
        status: "warning",
        ip: "185.220.101.5",
        details: `Failed attempt #${nextAttempts}. Progressive latency delay of ${nextAttempts * 500}ms injected.`,
      };
      setLogs((prev) => [newLog, ...prev]);
      addToast("warning", "Failed Attempt Recorded", `Attempt #${nextAttempts} logged. Progressive delay enabled.`);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterStatus !== "all" && log.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.ip.includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Security &amp; Audit Logs
            </span>
            <Badge variant="primary">Argon2id + Progressive Rate Limiter Active</Badge>
          </div>
        }
        subtitle="Immutable security audit trail, IP telemetry, progressive delay enforcement, and brute-force mitigation."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-1">
          <CardInset className="text-center">
            <p className="text-xs text-slate-500">Password Encryption</p>
            <p className="text-sm font-bold text-[#3A0F34] dark:text-[#f6f1f7] mt-1">
              Argon2id (m=65536, t=3, p=4)
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              Zero Plaintext Storage
            </p>
          </CardInset>

          <CardInset className="text-center">
            <p className="text-xs text-slate-500">Brute-Force Shield</p>
            <p className="text-sm font-bold text-[#3A0F34] dark:text-[#f6f1f7] mt-1">
              {isLocked ? `Throttled (${lockoutTimer}s)` : "Active &amp; Monitoring"}
            </p>
            <p className="text-[10px] text-[#EAAA00] mt-0.5">
              Progressive Delays after Failure
            </p>
          </CardInset>

          <CardInset className="text-center">
            <p className="text-xs text-slate-500">Session Policy</p>
            <p className="text-sm font-bold text-[#3A0F34] dark:text-[#f6f1f7] mt-1">
              HTTP-Only &amp; SameSite=Strict
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              Anti-CSRF Protection
            </p>
          </CardInset>

          <CardInset className="text-center">
            <p className="text-xs text-slate-500">Audit Events Logged</p>
            <p className="text-2xl font-bold tabular-nums text-[#3A0F34] dark:text-[#f6f1f7]">
              {logs.length}
            </p>
            <p className="text-[10px] text-slate-500">All Operations Tracked</p>
          </CardInset>
        </div>
      </Card>

      {/* Interactive Security Demonstration Panel */}
      <Card
        title="Interactive Rate-Limiting &amp; Lockout Test Sandbox"
        subtitle="Simulate brute-force attempts from a malicious IP to test progressive delays and automatic source throttling:"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 neu-inset rounded-2xl">
          <div>
            <p className="text-sm font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Simulated Malicious IP: <code>185.220.101.5</code>
            </p>
            <p className="text-xs text-slate-600 dark:text-[#bdaec2] mt-0.5">
              Failed Attempts: <strong>{testAttempts} / 4</strong> | Status:{" "}
              {isLocked ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  LOCKED OUT ({lockoutTimer}s remaining)
                </span>
              ) : testAttempts > 0 ? (
                <span className="text-[#EAAA00] font-bold">
                  Progressive delay ({testAttempts * 500}ms)
                </span>
              ) : (
                <span className="text-emerald-600 font-bold">Normal</span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={simulateFailedLogin}
              disabled={isLocked}
              className="neu-btn bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            >
              Simulate Bad Credential Attack
            </button>
            <button
              onClick={() => {
                setTestAttempts(0);
                setIsLocked(false);
                setLockoutTimer(0);
                addToast("info", "Throttle Reset", "Test IP counter reset to 0.");
              }}
              className={btnGhost}
            >
              Reset Counter
            </button>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card
        title="Audit Trail Logs"
        action={
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search user, action, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl neu-inset px-3 py-1.5 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00] max-w-xs"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl neu-inset px-2.5 py-1.5 text-xs text-[#3A0F34] dark:text-[#f6f1f7]"
            >
              <option value="all">All Events</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-white/60 dark:border-[#38163f]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="px-3">User / Identity</th>
                <th className="px-3">Action</th>
                <th className="px-3">Resource</th>
                <th className="px-3">IP Address</th>
                <th className="px-3">Status</th>
                <th className="px-3">Security Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-200/50 dark:border-[#2d1433]">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono">
                    {log.timestamp}
                  </td>
                  <td className="px-3 font-semibold text-[#3A0F34] dark:text-[#f6f1f7]">
                    {log.user}
                  </td>
                  <td className="px-3 font-mono text-[11px] font-bold text-[#EAAA00]">
                    {log.action}
                  </td>
                  <td className="px-3">{log.resource}</td>
                  <td className="px-3 font-mono">{log.ip}</td>
                  <td className="px-3">
                    <Badge
                      variant={
                        log.status === "success"
                          ? "success"
                          : log.status === "warning"
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                    >
                      {log.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-3 text-slate-600 dark:text-[#bdaec2] max-w-xs truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
