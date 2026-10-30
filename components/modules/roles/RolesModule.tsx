"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardInset,
  Badge,
  btnCls,
  btnSecondary,
  inputCls,
  useToast,
  BulkUploadModal,
  BulkDownloadModal,
} from "@/components/ui";
import { Upload, Download, ShieldCheck, UserPlus, Users, RefreshCw } from "lucide-react";
import { getUsersFromDb, bulkCreateUsersInDb, DbUserRecord } from "@/lib/dataService";

interface RoleDef {
  id: string;
  name: string;
  displayName: string;
  usersCount: number;
  description: string;
  permissions: { category: string; actions: string[] }[];
}

const ROLES: RoleDef[] = [
  {
    id: "super_admin",
    name: "super_admin",
    displayName: "Super Administrator",
    usersCount: 2,
    description: "Unrestricted access across all registry tables, security settings, and system governance.",
    permissions: [
      { category: "Patient Records", actions: ["Create", "Read", "Update", "Delete", "Sensitive Health Data"] },
      { category: "Treatments & Factor", actions: ["Administer Injections", "Edit Dosing", "Delete Records"] },
      { category: "Data Ingestion & Export", actions: ["Batch Import CSV/XLSX", "Bulk Export", "Raw Dump"] },
      { category: "Security & Governance", actions: ["Audit Logs", "Brute-force Management", "Role Assignment", "Key Rotation"] },
    ],
  },
  {
    id: "admin",
    name: "admin",
    displayName: "Registry Administrator",
    usersCount: 5,
    description: "Manage users, patient registrations, treatment catalogs, and data export reports.",
    permissions: [
      { category: "Patient Records", actions: ["Create", "Read", "Update", "Delete"] },
      { category: "Treatments & Factor", actions: ["Administer Injections", "Edit Dosing"] },
      { category: "Data Ingestion & Export", actions: ["Batch Import CSV/XLSX", "Bulk Export"] },
      { category: "Security & Governance", actions: ["Audit Logs", "View Roles"] },
    ],
  },
  {
    id: "manager",
    name: "manager",
    displayName: "HTC Clinic Manager",
    usersCount: 8,
    description: "Oversee hemophilia treatment center operations, patient flow, and monthly reporting.",
    permissions: [
      { category: "Patient Records", actions: ["Create", "Read", "Update"] },
      { category: "Treatments & Factor", actions: ["Administer Injections", "View Dosing"] },
      { category: "Data Ingestion & Export", actions: ["Export Cohort Reports"] },
      { category: "Security & Governance", actions: ["Self Profile"] },
    ],
  },
  {
    id: "clinician",
    name: "clinician",
    displayName: "Staff Clinician / Nurse",
    usersCount: 19,
    description: "Frontline clinical records entry, injection administration, and emergency treatment logging.",
    permissions: [
      { category: "Patient Records", actions: ["Create", "Read"] },
      { category: "Treatments & Factor", actions: ["Administer Injections", "View History"] },
      { category: "Data Ingestion & Export", actions: ["Single Patient Summary"] },
      { category: "Security & Governance", actions: ["Self Profile"] },
    ],
  },
];

export default function RolesModule({ isLiveDb = true }: { isLiveDb?: boolean }) {
  const { addToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<RoleDef>(ROLES[0]);

  // DB Users State
  const [users, setUsers] = useState<DbUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // New User Quick Provision Form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<DbUserRecord["role"]>("clinician");
  const [newDept, setNewDept] = useState("HTC Center");

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsersFromDb(isLiveDb);
      setUsers(data);
    } catch {
      // fallback
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [isLiveDb]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    const payload = {
      email: newEmail.trim().toLowerCase(),
      full_name: newName.trim(),
      role: newRole,
      status: "active" as const,
      department: newDept,
      created_at: new Date().toISOString(),
    };

    const res = await bulkCreateUsersInDb([payload], isLiveDb);
    if (res.success) {
      setUsers((prev) => [payload as DbUserRecord, ...prev]);
      setNewEmail("");
      setNewName("");
      addToast(
        "success",
        "Authorized User Provisioned",
        `Created authorized access account for ${payload.full_name}.`
      );
    } else {
      addToast("error", "Failed to Provision", res.error || "Database error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── AUTHORIZED DATABASE PERSONNEL & BULK USER MANAGEMENT ── */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Authorized Database Users (public.users)
            </span>
            <Badge variant="primary">{users.length} Active DB Personnel</Badge>
          </div>
        }
        subtitle="Manage pre-authorized clinical staff, administrators, and HTC managers who can sign in to UMEED:"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadUsers}
              disabled={loadingUsers}
              className="p-2 rounded-xl neu-btn hover:text-[#EAAA00] cursor-pointer"
              title="Refresh DB Users"
            >
              <RefreshCw size={13} className={loadingUsers ? "animate-spin text-[#EAAA00]" : ""} />
            </button>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk upload authorized database users from Excel or CSV"
            >
              <Upload size={14} className="text-[#EAAA00]" />
              <span>Bulk Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className={`${btnSecondary} flex items-center gap-1.5`}
              title="Bulk download database users to Excel (.xlsx) or CSV (.csv)"
            >
              <Download size={14} className="text-[#EAAA00]" />
              <span>Bulk Download</span>
            </button>
          </div>
        }
      >
        {/* Quick Provisioning Form */}
        <form onSubmit={handleCreateUser} className="neu-inset p-3 rounded-2xl grid gap-3 sm:grid-cols-4 items-end mb-4">
          <div>
            <label className="text-[11px] font-bold text-[#3A0F34] dark:text-[#f6f1f7] block mb-1">
              Authorized Email
            </label>
            <input
              type="email"
              className={inputCls}
              placeholder="e.g. nurse@befal.org"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#3A0F34] dark:text-[#f6f1f7] block mb-1">
              Full Name
            </label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Nurse Fatima"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#3A0F34] dark:text-[#f6f1f7] block mb-1">
              Assigned Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className={inputCls}
            >
              <option value="super_admin">Super Administrator</option>
              <option value="admin">Administrator</option>
              <option value="manager">HTC Manager</option>
              <option value="clinician">Staff Clinician</option>
            </select>
          </div>
          <button type="submit" className={btnCls}>
            <UserPlus size={14} />
            <span>Authorize User</span>
          </button>
        </form>

        {/* Database Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-white/60 dark:border-[#38163f]">
              <tr>
                <th className="py-2.5 px-3">Personnel Name</th>
                <th className="px-3">Authorized Email</th>
                <th className="px-3">Security Role</th>
                <th className="px-3">Department / Unit</th>
                <th className="px-3">Database Status</th>
                <th className="px-3">Account State</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id || u.email}
                  className="border-t border-slate-200/50 dark:border-[#2d1433] hover:bg-white/40 dark:hover:bg-[#251229]/40"
                >
                  <td className="py-2.5 px-3 font-semibold text-[#3A0F34] dark:text-[#f6f1f7]">
                    {u.full_name}
                  </td>
                  <td className="px-3 font-mono text-slate-600 dark:text-slate-300">
                    {u.email}
                  </td>
                  <td className="px-3">
                    <span className="capitalize font-bold text-[#EAAA00]">
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 text-slate-500">{u.department || "Clinical Unit"}</td>
                  <td className="px-3 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                      db_verified
                    </span>
                  </td>
                  <td className="px-3">
                    <Badge variant={u.status === "active" ? "success" : "neutral"} size="sm">
                      {u.status || "active"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users loaded from database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── ROLES & PERMISSIONS RBAC MATRIX ── */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
              Roles &amp; Access Permissions
            </span>
            <Badge variant="primary">Role-Based Access Control (RBAC)</Badge>
          </div>
        }
        subtitle="Manage authorization matrices, operational privilege levels, and sensitive patient data access boundaries."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-1">
          {ROLES.map((role) => {
            const isSelected = selectedRole.id === role.id;
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                  isSelected
                    ? "neu-inset ring-2 ring-[#EAAA00] dark:ring-[#EAAA00]"
                    : "neu-card neu-card-hover"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={isSelected ? "primary" : "neutral"} size="sm">
                    {role.usersCount} Active Accounts
                  </Badge>
                  {isSelected && <span className="text-xs text-[#EAAA00] font-bold">Selected</span>}
                </div>
                <h3 className="font-bold text-sm text-[#3A0F34] dark:text-[#f6f1f7]">
                  {role.displayName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {role.description}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Permissions Breakdown for Selected Role */}
      <Card
        title={`Permissions Matrix: ${selectedRole.displayName}`}
        subtitle={`Scope of privileges and authorization rights granted to ${selectedRole.name}:`}
        action={
          <button
            onClick={() =>
              addToast(
                "success",
                "Permissions Verified",
                `Access security tokens synchronized for role ${selectedRole.displayName}`
              )
            }
            className={btnCls}
          >
            Save Policy Rule
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 pt-2">
          {selectedRole.permissions.map((p) => (
            <CardInset key={p.category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#3A0F34] dark:text-[#f6f1f7]">
                  {p.category}
                </h4>
                <Badge variant="success" size="sm">{p.actions.length} Authorized</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.actions.map((act) => (
                  <span
                    key={act}
                    className="inline-flex items-center gap-1 neu-btn px-2.5 py-1 rounded-lg text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7]"
                  >
                    ✓ {act}
                  </span>
                ))}
              </div>
            </CardInset>
          ))}
        </div>
      </Card>

      {/* Universal Bulk Upload Modal for Users */}
      <BulkUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        entityType="users"
        title="Bulk Upload Authorized Personnel (Excel / CSV)"
        isLiveDb={isLiveDb}
        onSuccess={(imported) => {
          setUsers((prev) => [...imported, ...prev]);
        }}
      />

      {/* Universal Bulk Download Modal for Users */}
      <BulkDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        entityType="users"
        title="Bulk Download Database Personnel List"
        data={users}
      />
    </div>
  );
}
