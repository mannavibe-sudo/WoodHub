-- WoodHub database schema (for Supabase / Postgres)
-- Run this once in your Supabase project's SQL Editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- ============================================================
-- Table 1: log_entries
-- Covers both "Euca Chips Log Book" and "Euco Wood Log Book"
-- (same 32 columns in the original spreadsheet, distinguished
-- by log_type)
-- ============================================================
create table if not exists log_entries (
  id uuid primary key default gen_random_uuid(),
  log_type text not null check (log_type in ('euca_chips', 'euco_wood')),

  material text,
  truck_number text,
  delivery_chalan text,
  driver_mobile text,
  transporter_name text,
  lorry_receipt text,
  transporter_mobile text,
  truck_capacity_mt numeric,
  truck_length numeric,
  transport_rate numeric,
  advance_paid numeric,
  advance_payment_date date,
  advance_paid_to text,
  final_payment numeric,
  loading_location text,
  weight_pi_yard_mt numeric,
  material_cost numeric,
  invoice_value_raised numeric,
  dispatch_date date,
  tax_invoice_number text,
  eway_bill_no text,
  reached_on date,
  wc_number text,
  weight_itc_yard numeric,
  weight_loss numeric,
  total_payment_to_transport numeric,
  bill_amount_raised_itc numeric,
  bill_amount_raised_date_itc date,
  gst_amount numeric,
  payment_received_date_itc date,
  total_amount_received_itc numeric,
  margin_pnl numeric,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_log_entries_type on log_entries(log_type);
create index if not exists idx_log_entries_truck on log_entries(truck_number);
create index if not exists idx_log_entries_dispatch on log_entries(dispatch_date);

-- ============================================================
-- Table 2: assessment_log
-- Covers the "Assisment Log Book" sheet
-- ============================================================
create table if not exists assessment_log (
  id uuid primary key default gen_random_uuid(),
  sr_no integer,
  truck_number text,
  material_loaded text,
  loading_location text,
  dispatch_date date,
  reached_on date,
  weight_pi_yard_mt numeric,
  weight_itc_yard numeric,
  weight_loss_mt numeric,
  eway_bill_amt_with_gst numeric,
  payment_received_itc numeric,
  gst_amount numeric,
  total_amount_received numeric,
  difference_in_credit numeric,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- updated_at auto-touch trigger
-- ============================================================
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_log_entries_updated on log_entries;
create trigger trg_log_entries_updated before update on log_entries
  for each row execute function touch_updated_at();

drop trigger if exists trg_assessment_log_updated on assessment_log;
create trigger trg_assessment_log_updated before update on assessment_log
  for each row execute function touch_updated_at();

-- ============================================================
-- Row Level Security
-- Only signed-in users (via Supabase Auth) can read/write.
-- This keeps the data private even though the app's source
-- code and API URL are public (it's a public GitHub repo).
-- ============================================================
alter table log_entries enable row level security;
alter table assessment_log enable row level security;

drop policy if exists "authenticated_full_access" on log_entries;
create policy "authenticated_full_access" on log_entries
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on assessment_log;
create policy "authenticated_full_access" on assessment_log
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
