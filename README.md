# BEFAL — Premium Neumorphic Registry & Intelligence Application

A production-grade web application built with a **Soft-Neumorphism + Subtle Glassmorphism** design identity for the meed Welfare Foundation Pakistan registry and clinical management.

---

## 1. Design Identity & Tokens

### Brand Palette

- **Ice Silver**: `#DDE3E8` (Light mode primary canvas and soft neumorphic surfaces)
- **Deep Aubergine**: `#3A0F34` (Primary high-contrast brand typography and dark accents)
- **Marigold**: `#EAAA00` (Focal highlights, active states, progress indicators, CTA badges)

### Visual Architecture

- **Soft Raised Surfaces**: Dual-direction shadows (`6px 6px 14px #b8bec5, -6px -6px 14px #ffffff`)
- **Soft Inset Surfaces**: Subtle recessed fields for inputs and active controls (`inset 3px 3px 6px #b8bec5, inset -3px -3px 6px #ffffff`)
- **Light Glassmorphism**: `backdrop-blur-md` on floating headers, dialog overlays, and toast notifications.
- **Micro-Animations**: Pressed elevation shifts and smooth cubic-bezier transitions.

---

## 2. Theme Management (Light & Dark Modes)

- **Light Mode**: `#DDE3E8` canvas with layered silver neumorphic elements and Deep Aubergine `#3A0F34` text.
- **Dark Mode**: `#150917` aubergine-tinted charcoal background with layered dark plum surfaces (`#1f0f22`), warm white typography (`#f6f1f7`), and dark dual shadows (`#0c040d` / `#2b142f`).
- **Features**: Real-time theme switcher in header, automatic system preference detection (`prefers-color-scheme`), and persistent `localStorage` sync.

---

## 3. Befal Typography Studio

Interactive typography sandbox featuring **10 curated typeface families** with live specimens of the word **"Befal"**, weight selection, component previews, and instant global application:

1. **Manrope** _(Default Brand Font — Geometric Sans)_
2. **Montserrat** _(Modern Urban Geometric Sans)_
3. **Inter** _(Humanist High-Legibility Interface Standard)_
4. **Plus Jakarta Sans** _(Neo-Grotesque Premium Tech)_
5. **DM Sans** _(Low-Contrast Dense Screen Sans)_
6. **Playfair Display** _(High-Contrast Editorial Luxury Serif)_
7. **Cormorant Garamond** _(Classic Literary Heritage Serif)_
8. **Bebas Neue** _(Condensed High-Impact Headline Display)_
9. **Oswald** _(Architectural Digital Sans)_
10. **Lora** _(Calligraphic Contemporary Book Serif)_

---

## 4. Key Application Modules

### 📊 Clinical Intelligence Dashboard

- Real-time KPI statistic cards (Total Patients, Active Cohorts, Treatments, Factor Consumed IU, Inhibitors).
- Interactive Recharts data visualizations:
  - Monthly registration velocity bar charts.
  - Composed treatments count vs. Factor IU consumption trends.
  - Diagnosis category pie/donut charts.
  - Baseline factor severity classification.
  - Factor inventory product demand breakdown.
- Date presets: 30 days, 90 days, 1 year, and All Time.

### 👥 Patient & User Management

- Complete CRUD: View, Register, Edit, and Delete (with confirmation modal).
- Real-time search across Name, Registration # (`H-#`), CNIC, Phone, and City.
- Multi-dimensional filters (Diagnosis, Severity, Province, Gender).
- Bulk selection, bulk delete, and bulk export.
- Dedicated patient profile details view with clinical history and treatment administration shortcuts.

### 📥 CSV & Excel Batch Import

- Drag-and-drop file upload + file browser.
- File validation (MIME, `.csv` / `.xlsx`, 10MB limit).
- Automatic header detection and interactive column mapping.
- Row-level validation and error reporting with row numbers.
- Duplicate detection against existing records (CNIC / Name).
- Sample CSV and Excel template downloads.
- Import batch history tracking.

### 📤 Excel & CSV Export

- Export all, selected, or filtered records.
- Granular column selection checklist.
- Include/exclude headers toggle.
- **Security**: Formula injection shielding (escapes `=`, `+`, `-`, `@` with apostrophe `'`).
- Sensitive credential and password hash omission.
- Export history logging.

### 🔒 Authentication, Security & RBAC

- Role-Based Access Control (Super Administrator, Administrator, HTC Manager, Staff Clinician).
- Brute-force protection telemetry and rate-limiting test sandbox.
- Progressive latency injection after repeated failed authentication attempts.
- Argon2id password hashing specification.
- Security audit logs table tracking actions, resource targets, and client IPs.

---

## 5. Local Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional for local demo)
cp .env.example .env.local

# 3. Launch development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 6. Database Migrations (Supabase & PostgreSQL)

The unified `schema.sql` contains the complete idempotent database schema:

1. `patients` & `patients_view` (derived age and WHO severity).
2. `treatments` & `injections` (factor stock catalog).
3. `dashboard_stats` PostgreSQL RPC function.
4. `users`, `roles`, `audit_logs`, `import_history`, and `export_history`.
5. Row-Level Security (RLS) policies and performance indexes.

Execute `schema.sql` directly in your Supabase SQL Editor or PostgreSQL instance.

---

## 7. Modular Project Structure

```
├── app/                               # Next.js App Router root
│   ├── globals.css                    # Design system tokens & neumorphic CSS classes
│   ├── layout.tsx                     # Root layout with Theme and Nav Providers
│   └── page.tsx                       # Main coordinator orchestrating domain modules
├── components/
│   ├── ui/                            # Base reusable Neumorphic UI Design System
│   │   └── index.tsx                  # Card, InsetCard, Kpi, Badge, Modal, Tabs, Label, Toast
│   ├── layout/                        # Layout & Navigation Frame
│   │   └── Shell.tsx                  # Top header, drawer navigation, role switch modal
│   └── modules/                       # Domain Feature Modules
│       ├── dashboard/                 # Dashboard metrics, charts & KPI telemetry
│       │   └── DashboardModule.tsx
│       ├── patients/                  # Patient registry management
│       │   ├── PatientList.tsx        # Searchable, filterable patient table
│       │   ├── PatientForm.tsx        # Dynamic registration form
│       │   └── PatientDetails.tsx     # Comprehensive clinical patient profile
│       ├── treatments/                # Clinical factor therapies & infusion logging
│       │   ├── TreatmentForm.tsx      # Dose calculation & administration form
│       │   └── TreatmentTable.tsx     # Treatment logs & dosage history
│       ├── injections/                # Factor & bypassing medication inventory
│       │   └── InjectionsCatalog.tsx
│       ├── import-export/             # Ingestion & export pipelines
│       │   ├── ImportModule.tsx       # CSV & Excel batch parsing with mapping
│       │   ├── ExportModule.tsx       # ExcelJS multi-sheet report generator
│       │   └── HistoryModule.tsx      # Batch transaction audit history
│       ├── roles/                     # Permissions & access matrix
│       │   └── RolesModule.tsx
│       ├── security/                  # Rate limiting & audit security
│       │   └── SecurityAuditModule.tsx
│       └── typography/                # 10-typeface interactive studio
│           └── TypographyStudio.tsx
├── context/                           # React Context & State Providers
│   └── providers.tsx                  # Theme, Typography, Nav, React Query
├── data/                              # Static data schemas & mock dataset
│   ├── fields.ts                      # Clinical form sections & fields schema
│   └── mockData.ts                    # Patient records, treatments, audit logs
├── lib/                               # Third-party integrations
│   └── supabase.ts                    # Supabase client singleton
└── types/                             # Centralized TypeScript definitions
    └── index.ts                       # Shared interfaces and type exports
```
