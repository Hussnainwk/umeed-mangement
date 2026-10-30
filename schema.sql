-- =====================================================================
-- Hemophilia registry - Supabase schema (idempotent: safe to re-run)
-- Run once in the Supabase SQL editor.
-- =====================================================================

-- 1. Extensions -------------------------------------------------------
create extension if not exists pg_trgm with schema extensions;   -- fast ilike '%text%' search

-- 2. Tables -----------------------------------------------------------
create sequence if not exists patient_reg_seq start 1;           -- H-1, H-2, ...

create table if not exists injections (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  type        text,
  strength    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists patients (
  patient_id      bigint generated always as identity primary key,
  registration_no text not null unique default ('H-' || nextval('patient_reg_seq')),
  patient_name    text not null,
  date_of_birth   date,
  gender text, marital_status text, cnic text, blood_group text,
  record_date     date not null default current_date,
  qualification text, profession text, job_title text,
  address text, city text, city_town text, province text,
  telephone text, emergency_number text, email text,
  guardian_name text, guardian_cnic text,
  household_other_bleeder boolean, household_patient_name text, household_relation text,
  diagnosis text,
  registered_with_chapter boolean, chapter_name text,
  diagnostic_technique text, diagnostic_other text,
  baseline_factor_activity numeric,
  diagnostic_reason text, diagnostic_reason_other text,
  age_first_diagnosed int,
  treatment_type text, inhibitor_status text,
  bleeding_episodes_12m int, treatment_products text,
  hcv text, hiv text, hbv text,
  vaccinations text[], other_vaccinations text,
  joint_deformity text, activity_level text,
  filled_by text, designation text, organization text, comments text,
  created_at      timestamptz not null default now()
);
alter table patients add column if not exists updated_at timestamptz not null default now();

create table if not exists treatments (
  id             bigint generated always as identity primary key,
  patient_id     bigint not null references patients(patient_id) on delete cascade,
  injection_id   bigint not null references injections(id),
  treatment_date date not null default current_date,
  reason         text not null,
  medication     text,
  dose_iu        numeric,
  comments       text,
  created_at     timestamptz not null default now()
);

-- 3. Data-quality constraints ----------------------------------------
alter table patients drop constraint if exists chk_baseline;
alter table patients drop constraint if exists chk_age_dx;
alter table patients drop constraint if exists chk_bleeds;
alter table patients drop constraint if exists chk_cnic;
alter table patients drop constraint if exists chk_guardian_cnic;
alter table treatments drop constraint if exists chk_dose;

alter table patients  add constraint chk_baseline     check (baseline_factor_activity between 0 and 100);
alter table patients  add constraint chk_age_dx       check (age_first_diagnosed between 0 and 120);
alter table patients  add constraint chk_bleeds       check (bleeding_episodes_12m >= 0);
alter table patients  add constraint chk_cnic         check (cnic ~ '^\d{5}-?\d{7}-?\d$');          -- drop these two if you
alter table patients  add constraint chk_guardian_cnic check (guardian_cnic ~ '^\d{5}-?\d{7}-?\d$'); -- want free-text CNICs
alter table treatments add constraint chk_dose        check (dose_iu >= 0);

-- 4. Indexes (each one maps to a query the app runs) ------------------
-- Remove the plain indexes from the first version (replaced below)
drop index if exists patients_record_date_idx, patients_patient_name_idx,
                     treatments_patient_id_idx, treatments_treatment_date_idx;

-- Patient search box: name / H-# / CNIC / phone (ilike '%q%')
create index if not exists patients_name_trgm  on patients using gin (patient_name    extensions.gin_trgm_ops);
create index if not exists patients_reg_trgm   on patients using gin (registration_no extensions.gin_trgm_ops);
create index if not exists patients_cnic_trgm  on patients using gin (cnic            extensions.gin_trgm_ops);
create index if not exists patients_phone_trgm on patients using gin (telephone       extensions.gin_trgm_ops);

-- Duplicate guard: one registration per CNIC (children without CNIC stay null)
create unique index if not exists patients_cnic_uq on patients (cnic) where cnic is not null;

-- Date-range reports and dashboard (new registrations)
create index if not exists patients_record_date on patients (record_date);

-- Patient page: history newest-first, also serves "no treatment in 90 days"
create index if not exists treatments_patient_date on treatments (patient_id, treatment_date desc);

-- Dashboard/report date range: index-only scan, no table reads
create index if not exists treatments_date_cover on treatments (treatment_date)
  include (injection_id, dose_iu, reason);

-- FK lookups and deleting/hiding injections
create index if not exists treatments_injection on treatments (injection_id);

-- Low-cardinality columns (diagnosis, province, gender...) are deliberately NOT indexed:
-- Postgres scans a table this size faster than it walks such an index.

-- 5. updated_at trigger ----------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists patients_updated_at on patients;
create trigger patients_updated_at before update on patients
  for each row execute function set_updated_at();

-- 6. View: derived age + severity (not stored, never stale) ----------
drop view if exists patients_view;
create view patients_view with (security_invoker = true) as
select p.*,
  extract(year from age(p.date_of_birth))::int as age,
  case when p.baseline_factor_activity is null then 'Unknown'
       when p.baseline_factor_activity < 1  then 'Severe'
       when p.baseline_factor_activity <= 5 then 'Moderate'
       else 'Mild' end as severity
from patients p;

-- 7. Row level security: signed-in users only ------------------------
alter table injections enable row level security;
alter table patients   enable row level security;
alter table treatments enable row level security;
drop policy if exists "auth all" on injections;
drop policy if exists "auth all" on patients;
drop policy if exists "auth all" on treatments;
create policy "auth all" on injections for all to authenticated using (true) with check (true);
create policy "auth all" on patients   for all to authenticated using (true) with check (true);
create policy "auth all" on treatments for all to authenticated using (true) with check (true);

-- 8. Seed injection list ---------------------------------------------
insert into injections (name, type, strength) values
 ('Factor VIII (Recombinant)',    'Factor VIII',     '250/500/1000 IU'),
 ('Factor VIII (Plasma-derived)', 'Factor VIII',     '250/500/1000 IU'),
 ('Factor IX',                    'Factor IX',       '500/1000 IU'),
 ('FEIBA',                        'Bypassing agent', '500/1000 U'),
 ('NovoSeven (rFVIIa)',           'Bypassing agent', '1/2/5 mg'),
 ('Emicizumab (Hemlibra)',        'Non-factor',      '30/60/150 mg'),
 ('Desmopressin (DDAVP)',         'Other',           '4 mcg/ml'),
 ('Tranexamic acid',              'Other',           '500 mg/5 ml'),
 ('Cryoprecipitate',              'Blood product',   null),
 ('Fresh frozen plasma',          'Blood product',   null)
on conflict (name) do nothing;

-- 9. Dashboard: one round trip, each table read once (CTEs) ----------
create or replace function dashboard_stats(p_from date, p_to date)
returns jsonb language sql stable parallel safe security invoker as $$
with p as materialized (
  select patient_id, record_date, diagnosis, province, treatment_type,
         inhibitor_status, hcv, hiv, hbv, severity, age
  from patients_view
), t as materialized (
  select tr.treatment_date, tr.reason, tr.dose_iu, i.name as injection
  from treatments tr join injections i on i.id = tr.injection_id
  where tr.treatment_date between p_from and p_to
)
select jsonb_build_object(
  'totals', jsonb_build_object(
    'patients',      (select count(*) from p),
    'new_patients',  (select count(*) from p where record_date between p_from and p_to),
    'treatments',    (select count(*) from t),
    'total_iu',      (select coalesce(sum(dose_iu), 0) from t),
    'inhibitors',    (select count(*) from p where inhibitor_status = 'Positive'),
    'no_recent_treatment', (select count(*) from p where not exists (
        select 1 from treatments x where x.patient_id = p.patient_id and x.treatment_date >= current_date - 90))
  ),
  'registrations', (select coalesce(jsonb_agg(r order by r.month), '[]') from (
    select to_char(date_trunc('month', record_date), 'YYYY-MM') as month, count(*) as value
    from p where record_date between p_from and p_to group by 1) r),
  'treatments_monthly', (select coalesce(jsonb_agg(r order by r.month), '[]') from (
    select to_char(date_trunc('month', treatment_date), 'YYYY-MM') as month,
           count(*) as treatments, coalesce(sum(dose_iu), 0) as iu
    from t group by 1) r),
  'diagnosis', (select coalesce(jsonb_agg(r), '[]') from (
    select coalesce(diagnosis, 'Unknown') as name, count(*) as value from p group by 1 order by 2 desc) r),
  'severity', (select coalesce(jsonb_agg(r), '[]') from (
    select severity as name, count(*) as value from p group by 1 order by 2 desc) r),
  'province', (select coalesce(jsonb_agg(r), '[]') from (
    select coalesce(province, 'Unknown') as name, count(*) as value from p group by 1 order by 2 desc) r),
  'treatment_type', (select coalesce(jsonb_agg(r), '[]') from (
    select coalesce(treatment_type, 'Unknown') as name, count(*) as value from p group by 1 order by 2 desc) r),
  'age_groups', (select coalesce(jsonb_agg(r order by r.sort), '[]') from (
    select case when age is null then 'Unknown' when age < 5 then '0-4' when age < 13 then '5-12'
                when age < 19 then '13-18' when age < 41 then '19-40' else '41+' end as name,
           min(coalesce(age, 999)) as sort, count(*) as value
    from p group by 1) r),
  'injections', (select coalesce(jsonb_agg(r), '[]') from (
    select injection as name, count(*) as value, coalesce(sum(dose_iu), 0) as iu
    from t group by 1 order by 2 desc) r),
  'reasons', (select coalesce(jsonb_agg(r), '[]') from (
    select reason as name, count(*) as value from t group by 1 order by 2 desc) r),
  'infections', (select jsonb_build_array(
    jsonb_build_object('name', 'HCV', 'value', count(*) filter (where hcv = 'Positive')),
    jsonb_build_object('name', 'HIV', 'value', count(*) filter (where hiv = 'Positive')),
    jsonb_build_object('name', 'HBV', 'value', count(*) filter (where hbv = 'Positive'))) from p)
);
$$;

-- 10. Refresh planner statistics -------------------------------------
analyze patients; analyze treatments; analyze injections;

-- =====================================================================
-- 11. BEFAL System Governance, Security & RBAC Tables
-- =====================================================================

-- Users table with Argon2id password hash
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role text not null default 'clinician' check (role in ('super_admin', 'admin', 'manager', 'clinician')),
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended', 'pending')),
  password_hash text not null,
  email_verified boolean not null default false,
  phone text,
  department text,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Login attempts (Brute-force mitigation & telemetry)
create table if not exists login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  ip_address text not null,
  success boolean not null default false,
  user_agent text,
  attempted_at timestamptz not null default now()
);
create index if not exists idx_login_attempts_ip on login_attempts (ip_address, attempted_at desc);

-- Audit logs
create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete set null,
  user_email text,
  action text not null,
  resource text not null,
  status text not null default 'success' check (status in ('success', 'warning', 'blocked', 'failure')),
  ip_address text,
  user_agent text,
  details text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_action on audit_logs (action, created_at desc);

-- Import history
create table if not exists import_history (
  id text primary key,
  filename text not null,
  format text not null check (format in ('csv', 'xlsx')),
  records_count int not null default 0,
  success_count int not null default 0,
  failed_count int not null default 0,
  status text not null default 'Completed' check (status in ('Completed', 'Partial', 'Failed')),
  operator text not null,
  created_at timestamptz not null default now()
);

-- Export history
create table if not exists export_history (
  id text primary key,
  filename text not null,
  format text not null check (format in ('csv', 'xlsx')),
  records_count int not null default 0,
  status text not null default 'Completed',
  operator text not null,
  created_at timestamptz not null default now()
);

-- RLS for governance
alter table users enable row level security;
alter table audit_logs enable row level security;
alter table import_history enable row level security;
alter table export_history enable row level security;
alter table login_attempts enable row level security;

create policy "authenticated users read users" on users for select to authenticated using (true);
create policy "admins write users" on users for all to authenticated using (true) with check (true);
create policy "authenticated read audit_logs" on audit_logs for select to authenticated using (true);
create policy "audit_logs insert" on audit_logs for insert to authenticated with check (true);
create policy "authenticated import_history" on import_history for all to authenticated using (true) with check (true);
create policy "authenticated export_history" on export_history for all to authenticated using (true) with check (true);