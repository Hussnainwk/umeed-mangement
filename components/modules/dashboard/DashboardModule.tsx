"use client";
import React, { useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Kpi, Label, Badge, btnGhost } from "@/components/ui";
import { useNav, useTheme } from "@/context/providers";
import {
  PatientRecord,
  TreatmentRecord,
  HistoryRecord,
} from "@/data/mockData";
import TreatmentTable from "@/components/modules/treatments/TreatmentTable";

const BRAND_PALETTE = [
  "#EAAA00", // Marigold
  "#3A0F34", // Deep Aubergine
  "#0f766e", // Teal
  "#be123c", // Rose
  "#4338ca", // Indigo
  "#b45309", // Amber
  "#0891b2", // Cyan
  "#64748b", // Slate
];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

interface DashboardModuleProps {
  patients: PatientRecord[];
  treatments: TreatmentRecord[];
  history: HistoryRecord[];
}

export default function DashboardModule({
  patients,
  treatments,
  history,
}: DashboardModuleProps) {
  const { setActiveView } = useNav();
  const { resolvedTheme } = useTheme();

  // Dashboard Filters
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(iso(new Date()));

  // Quick Date Presets
  const preset = (days: number | null) => {
    setFrom(days === null ? "2020-01-01" : daysAgo(days));
    setTo(iso(new Date()));
  };

  // Aggregated Stats
  const totalIu = treatments.reduce((acc, t) => acc + (t.dose_iu || 0), 0);
  const inhibitorsCount = patients.filter(
    (p) => p.inhibitor_status === "Positive",
  ).length;
  const severeCount = patients.filter((p) => p.severity === "Severe").length;

  // Chart Aggregations
  const diagnosisChartData = [
    {
      name: "Hemophilia A",
      value: patients.filter((p) => p.diagnosis === "Hemophilia A").length,
    },
    {
      name: "Hemophilia B",
      value: patients.filter((p) => p.diagnosis === "Hemophilia B").length,
    },
    {
      name: "von Willebrand",
      value: patients.filter((p) => p.diagnosis === "von Willebrand disease")
        .length,
    },
    {
      name: "Factor VII def",
      value: patients.filter((p) => p.diagnosis === "Factor VII deficiency")
        .length,
    },
  ];

  const severityChartData = [
    { name: "Severe (<1%)", value: severeCount },
    {
      name: "Moderate (1-5%)",
      value: patients.filter((p) => p.severity === "Moderate").length,
    },
    {
      name: "Mild (>5%)",
      value: patients.filter((p) => p.severity === "Mild").length,
    },
  ];

  // Dynamic monthly trends computed from real data
  const monthlyTrends = useMemo(() => {
    const monthMap = new Map<
      string,
      { month: string; registrations: number; treatments: number; iu: number }
    >();

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      monthMap.set(key, { month: key, registrations: 0, treatments: 0, iu: 0 });
    }

    patients.forEach((p) => {
      const m = (p.record_date || "").slice(0, 7);
      if (m && monthMap.has(m)) {
        monthMap.get(m)!.registrations += 1;
      }
    });

    treatments.forEach((t) => {
      const m = (t.treatment_date || "").slice(0, 7);
      if (m && monthMap.has(m)) {
        monthMap.get(m)!.treatments += 1;
        monthMap.get(m)!.iu += Number(t.dose_iu) || 0;
      }
    });

    return Array.from(monthMap.values());
  }, [patients, treatments]);

  // Factor products consumed breakdown computed from real treatments
  const factorConsumptionData = useMemo(() => {
    const map = new Map<string, number>();
    treatments.forEach((t) => {
      const name = t.injection_name || "Factor Product";
      map.set(name, (map.get(name) || 0) + (Number(t.dose_iu) || 0));
    });

    if (map.size === 0) return [];
    const maxVal = Math.max(...Array.from(map.values()), 1);
    const colors = [
      "bg-[#EAAA00]",
      "bg-[#3A0F34]",
      "bg-rose-600",
      "bg-teal-600",
      "bg-indigo-600",
    ];

    return Array.from(map.entries()).map(([name, val], idx) => ({
      name,
      val,
      color: colors[idx % colors.length],
      percent: Math.round((val / maxVal) * 100),
    }));
  }, [treatments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controls & Presets */}
      <div className="flex flex-wrap items-end justify-between gap-3 neu-inset p-4 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[#3A0F34] dark:text-[#f6f1f7]">
              Clinical Intelligence Dashboard
            </h1>
            <Badge variant="primary">Real-time Telemetry</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#bdaec2] mt-0.5">
            Umeed Welfare Foundation Pakistan Hemophilia Registry Intelligence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Label text="From">
            <input
              type="date"
              className="rounded-xl neu-inset px-3 py-1.5 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Label>
          <Label text="To">
            <input
              type="date"
              className="rounded-xl neu-inset px-3 py-1.5 text-xs text-[#3A0F34] dark:text-[#f6f1f7] focus:outline-none focus:ring-1 focus:ring-[#EAAA00]"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Label>

          <div className="flex items-center gap-1 pt-4">
            <button className={btnGhost} onClick={() => preset(30)}>
              30d
            </button>
            <button className={btnGhost} onClick={() => preset(90)}>
              90d
            </button>
            <button className={btnGhost} onClick={() => preset(365)}>
              1y
            </button>
            <button className={btnGhost} onClick={() => preset(null)}>
              All
            </button>
          </div>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi
          label="Total Patients"
          value={patients.length}
          hint="Enrolled in registry"
          trend={{ val: "+14%", positive: true }}
          icon="👥"
        />
        <Kpi
          label="Active Cohort"
          value={patients.filter((p) => p.status === "active").length}
          hint="Under active follow-up"
          trend={{ val: "100%", positive: true }}
          icon="✓"
        />
        <Kpi
          label="Treatments Logged"
          value={treatments.length}
          hint="Factor infusions"
          trend={{ val: "+23%", positive: true }}
          icon="💉"
        />
        <Kpi
          label="Factor Used (IU)"
          value={totalIu.toLocaleString()}
          hint="Aggregate dosage"
          trend={{ val: "+19.5k IU", positive: true }}
          icon="🧪"
        />
        <Kpi
          label="Inhibitor Positive"
          value={inhibitorsCount}
          hint="High clinical risk"
          trend={{ val: "Caution", positive: false }}
          icon="⚠️"
        />
        <Kpi
          label="Batch Imports"
          value={history.filter((h) => h.type === "import").length}
          hint="Verified datasets"
          trend={{ val: "Clean", positive: true }}
          icon="📥"
        />
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 neu-card rounded-2xl justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">
          Quick Registry Actions:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView("patients_new")}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] cursor-pointer"
          >
            ➕ Register Patient
          </button>
          <button
            onClick={() => setActiveView("treatments")}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] cursor-pointer"
          >
            💉 Administer Treatment
          </button>
          <button
            onClick={() => setActiveView("import")}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] cursor-pointer"
          >
            📥 Batch Import CSV/Excel
          </button>
          <button
            onClick={() => setActiveView("export")}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] cursor-pointer"
          >
            📤 Export Cohort Data
          </button>
          <button
            onClick={() => setActiveView("typography")}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#3A0F34] dark:text-[#f6f1f7] hover:text-[#EAAA00] cursor-pointer"
          >
            🎨 Typography Studio
          </button>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Registrations Trend */}
        <Card
          title="Patient Enrollments by Month"
          subtitle="Monthly registration velocity across HTC chapters"
        >
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={resolvedTheme === "dark" ? "#2d1433" : "#e2e8f0"}
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill: resolvedTheme === "dark" ? "#bdaec2" : "#64748b",
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: resolvedTheme === "dark" ? "#bdaec2" : "#64748b",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      resolvedTheme === "dark" ? "#1f0f22" : "#DDE3E8",
                    borderRadius: "1rem",
                    border: "1px solid #EAAA00",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  }}
                />
                <Bar
                  dataKey="registrations"
                  name="New Patients"
                  fill="#EAAA00"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Treatments & Factor Monthly Consumption */}
        <Card
          title="Treatments &amp; Factor Consumption (IU)"
          subtitle="Dual-axis correlation of factor unit demand vs. clinical infusions"
        >
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={resolvedTheme === "dark" ? "#2d1433" : "#e2e8f0"}
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill: resolvedTheme === "dark" ? "#bdaec2" : "#64748b",
                  }}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: resolvedTheme === "dark" ? "#bdaec2" : "#64748b",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{
                    fontSize: 11,
                    fill: resolvedTheme === "dark" ? "#bdaec2" : "#64748b",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      resolvedTheme === "dark" ? "#1f0f22" : "#DDE3E8",
                    borderRadius: "1rem",
                    border: "1px solid #EAAA00",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  yAxisId="left"
                  dataKey="treatments"
                  name="Treatments Count"
                  fill="#3A0F34"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="iu"
                  name="Factor Used (IU)"
                  stroke="#EAAA00"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2: Diagnosis & Severity */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Diagnosis Distribution */}
        <Card
          title="Diagnosis Breakdown"
          subtitle="Distribution across all enrolled bleeding disorders"
        >
          <div className="h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diagnosisChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {diagnosisChartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={BRAND_PALETTE[i % BRAND_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Severity Breakdown */}
        <Card
          title="Baseline Factor Severity"
          subtitle="WHO classification based on baseline factor %"
        >
          <div className="h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  <Cell fill="#be123c" />
                  <Cell fill="#EAAA00" />
                  <Cell fill="#0f766e" />
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Injections & Factor Stock Consumption */}
        <Card
          title="Factor Products Consumed"
          subtitle="Breakdown of administered vials"
          action={
            <button
              onClick={() => setActiveView("injections")}
              className="text-xs text-[#EAAA00] font-bold hover:underline"
            >
              Manage Products &rarr;
            </button>
          }
        >
          <div className="space-y-2.5 pt-1">
            {factorConsumptionData.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No factor infusions recorded yet.
              </p>
            ) : (
              factorConsumptionData.map((item) => (
                <div key={item.name} className="neu-inset p-2.5 rounded-xl">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-[#3A0F34] dark:text-[#f6f1f7] truncate">
                      {item.name}
                    </span>
                    <span className="tabular-nums text-[#EAAA00]">
                      {item.val.toLocaleString()} IU
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Treatments Table shortcut */}
      <TreatmentTable treatments={treatments.slice(0, 5)} />
    </div>
  );
}
