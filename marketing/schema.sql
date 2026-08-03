-- ============================================================================
-- Vector Master ERP — Initial Schema
-- ============================================================================
-- Roles:
--   admin    -> everything a marketer can do, PLUS: approve/reject market
--               requests, and manage users (profiles/roles).
--   marketer -> full day-to-day operations (market requests, clients,
--               invoices, research, digital log, tenders, feedback)
--               but cannot approve market requests or manage other users.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
create type public.user_role        as enum ('admin', 'marketer');
create type public.request_status   as enum ('pending', 'approved', 'rejected');
create type public.priority_level   as enum ('low', 'medium', 'high');
create type public.client_type      as enum ('organization', 'personal');
create type public.client_level     as enum ('standard', 'premium');
create type public.vat_status       as enum ('with_vat', 'without_vat');
create type public.share_target     as enum ('marketing_manager', 'management');

-- ----------------------------------------------------------------------------
-- 2. HELPER: updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. PROFILES (extends auth.users, carries role)
-- ----------------------------------------------------------------------------
create table public.mrk_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  email        text,
  role         public.user_role not null default 'marketer',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_mrk_profiles_updated_at
  before update on public.mrk_profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
-- New users default to 'marketer'; promote to 'admin' manually (see bottom).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mrk_profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    'marketer'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent a non-admin from changing their own (or anyone's) role via the
-- "update own profile" policy. Admins are unrestricted.
create or replace function public.protect_role_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Only admins can change user roles.';
  end if;
  return new;
end;
$$;

create trigger trg_mrk_protect_role_column
  before update on public.mrk_profiles
  for each row execute function public.protect_role_column();

-- ----------------------------------------------------------------------------
-- 4. ROLE-CHECK HELPERS (security definer avoids RLS recursion)
-- ----------------------------------------------------------------------------
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.mrk_profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.mrk_profiles where id = auth.uid()) = 'admin', false);
$$;

-- ----------------------------------------------------------------------------
-- 5. MARKET REQUESTS  (admin-only approval)
-- ----------------------------------------------------------------------------
create table public.mrk_market_requests (
  id             uuid primary key default gen_random_uuid(),
  request_no     text not null unique,
  request_date   date not null default current_date,
  request_type   text not null,
  description    text,
  priority       public.priority_level not null default 'medium',
  assigned_to    uuid references public.mrk_profiles (id),
  due_date       date,
  status         public.request_status not null default 'pending',
  file_url       text,
  voice_note_url text,
  created_by     uuid not null references public.mrk_profiles (id) default auth.uid(),
  approved_by    uuid references public.mrk_profiles (id),
  approved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_mrk_market_requests_updated_at
  before update on public.mrk_market_requests
  for each row execute function public.set_updated_at();

-- Stamp approver/timestamp automatically whenever status flips away from pending.
create or replace function public.stamp_market_request_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status and new.status in ('approved', 'rejected') then
    new.approved_by = auth.uid();
    new.approved_at = now();
  end if;
  return new;
end;
$$;

create trigger trg_mrk_market_requests_approval
  before update on public.mrk_market_requests
  for each row execute function public.stamp_market_request_approval();

-- ----------------------------------------------------------------------------
-- 6. CLIENT REGISTRY
-- ----------------------------------------------------------------------------
create table public.mrk_clients (
  id              uuid primary key default gen_random_uuid(),
  client_date     date not null default current_date,
  client_name     text not null,
  client_type     public.client_type not null default 'organization',
  business_sector text,
  tin_number      text,
  address         text,
  discovery       text,          -- e.g. telegram / tiktok / facebook / walk in
  level           public.client_level not null default 'standard',
  file_url        text,
  created_by      uuid not null references public.mrk_profiles (id) default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_mrk_clients_updated_at
  before update on public.mrk_clients
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. INVOICES
-- ----------------------------------------------------------------------------
create table public.mrk_invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_date   date not null default current_date,
  invoice_no     text not null unique,
  client_id      uuid references public.mrk_clients (id),
  client_name    text not null,
  reference_no   text,
  item_service   text,
  subtotal       numeric(14,2) not null default 0,
  vat_included   boolean not null default true,
  vat_amount     numeric(14,2) generated always as (
                    case when vat_included then round(subtotal * 0.15, 2) else 0 end
                 ) stored,
  grand_total    numeric(14,2) generated always as (
                    subtotal + case when vat_included then round(subtotal * 0.15, 2) else 0 end
                 ) stored,
  company_tin    text,
  payment_term   text,
  file_url       text,
  voice_note_url text,
  created_by     uuid not null references public.mrk_profiles (id) default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_mrk_invoices_updated_at
  before update on public.mrk_invoices
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. RESEARCH LOGIN
-- ----------------------------------------------------------------------------
create table public.mrk_research_logins (
  id           uuid primary key default gen_random_uuid(),
  research_date date not null default current_date,
  research_no  text not null unique,
  title        text not null,
  reason       text,
  objective    text,
  methodology  text,
  file_url     text,
  created_by   uuid not null references public.mrk_profiles (id) default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_mrk_research_logins_updated_at
  before update on public.mrk_research_logins
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. DIGITAL LOG
-- ----------------------------------------------------------------------------
create table public.mrk_digital_logs (
  id             uuid primary key default gen_random_uuid(),
  log_date       date not null default current_date,
  content_no     text not null unique,
  content_title  text not null,
  content_script text,
  social_channel text,
  share_to       public.share_target not null default 'marketing_manager',
  file_url       text,
  voice_url      text,
  created_by     uuid not null references public.mrk_profiles (id) default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_mrk_digital_logs_updated_at
  before update on public.mrk_digital_logs
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 10. TENDERS
-- ----------------------------------------------------------------------------
create table public.mrk_tenders (
  id            uuid primary key default gen_random_uuid(),
  tender_date   date not null default current_date,
  company_name  text not null,
  tender_no     text not null unique,
  item_service  text,
  cpo_amount    numeric(14,2),
  total_price   numeric(14,2),
  vat_status    public.vat_status not null default 'with_vat',
  file_url      text,
  created_by    uuid not null references public.mrk_profiles (id) default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_mrk_tenders_updated_at
  before update on public.mrk_tenders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 11. FEEDBACK
-- ----------------------------------------------------------------------------
create table public.mrk_feedbacks (
  id             uuid primary key default gen_random_uuid(),
  feedback_date  date not null default current_date,
  client_name    text not null,
  project_name   text,
  project_no     text,
  overall_score  int check (overall_score between 0 and 100),
  service_score  int check (service_score between 0 and 100),
  grade          text generated always as (
                    case
                      when greatest(coalesce(overall_score,0), coalesce(service_score,0)) >= 95 then 'A'
                      when greatest(coalesce(overall_score,0), coalesce(service_score,0)) >= 80 then 'B'
                      when greatest(coalesce(overall_score,0), coalesce(service_score,0)) >= 60 then 'C'
                      else 'D'
                    end
                 ) stored,
  file_url       text,
  created_by     uuid not null references public.mrk_profiles (id) default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_mrk_feedbacks_updated_at
  before update on public.mrk_feedbacks
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 12. INDEXES
-- ----------------------------------------------------------------------------
create index idx_mrk_market_requests_status      on public.mrk_market_requests (status);
create index idx_mrk_market_requests_created_by  on public.mrk_market_requests (created_by);
create index idx_mrk_clients_created_by          on public.mrk_clients (created_by);
create index idx_mrk_invoices_client_id          on public.mrk_invoices (client_id);
create index idx_mrk_invoices_created_by         on public.mrk_invoices (created_by);

-- ============================================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================================
alter table public.mrk_profiles         enable row level security;
alter table public.mrk_market_requests  enable row level security;
alter table public.mrk_clients          enable row level security;
alter table public.mrk_invoices         enable row level security;
alter table public.mrk_research_logins  enable row level security;
alter table public.mrk_digital_logs     enable row level security;
alter table public.mrk_tenders          enable row level security;
alter table public.mrk_feedbacks        enable row level security;

-- ---------------------------------------------------------------------------
-- 13.1 PROFILES — everyone can read (needed for "Assigned To" pickers);
--       users can edit their own basic info; only admins manage roles/users.
-- ---------------------------------------------------------------------------
create policy "mrk_profiles_select_all"
  on public.mrk_profiles for select
  to authenticated
  using (true);

create policy "mrk_profiles_update_self_or_admin"
  on public.mrk_profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
  -- role changes are additionally blocked for non-admins by
  -- trg_mrk_protect_role_column above.

create policy "mrk_profiles_insert_admin_only"
  on public.mrk_profiles for insert
  to authenticated
  with check (public.is_admin());
  -- normal signups are inserted by the handle_new_user() trigger
  -- (security definer), which bypasses RLS entirely.

create policy "mrk_profiles_delete_admin_only"
  on public.mrk_profiles for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 13.2 MARKET REQUESTS — marketers create & edit their own while pending;
--       ONLY admins may approve/reject or edit after a decision is made.
-- ---------------------------------------------------------------------------
create policy "mrk_market_requests_select_all"
  on public.mrk_market_requests for select
  to authenticated
  using (true);

create policy "mrk_market_requests_insert_own"
  on public.mrk_market_requests for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "mrk_market_requests_update_admin"
  on public.mrk_market_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "mrk_market_requests_update_owner_pending"
  on public.mrk_market_requests for update
  to authenticated
  using (created_by = auth.uid() and status = 'pending')
  with check (created_by = auth.uid() and status = 'pending');
  -- Owners can edit their own request only while it is still pending,
  -- and cannot move it out of 'pending' themselves (that requires admin).

create policy "mrk_market_requests_delete_admin_or_owner_pending"
  on public.mrk_market_requests for delete
  to authenticated
  using (public.is_admin() or (created_by = auth.uid() and status = 'pending'));

-- ---------------------------------------------------------------------------
-- 13.3 SHARED OPERATIONAL TABLES
--       (mrk_clients, mrk_invoices, mrk_research_logins, mrk_digital_logs,
--        mrk_tenders, mrk_feedbacks) — admin behaves exactly like a
--        marketer here: full CRUD for any authenticated user, edit/delete
--        restricted to the record's owner or an admin.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'mrk_clients', 'mrk_invoices', 'mrk_research_logins',
    'mrk_digital_logs', 'mrk_tenders', 'mrk_feedbacks'
  ]
  loop
    execute format('
      create policy "%1$s_select_all" on public.%1$s
        for select to authenticated using (true);

      create policy "%1$s_insert_own" on public.%1$s
        for insert to authenticated with check (created_by = auth.uid());

      create policy "%1$s_update_owner_or_admin" on public.%1$s
        for update to authenticated
        using (created_by = auth.uid() or public.is_admin())
        with check (created_by = auth.uid() or public.is_admin());

      create policy "%1$s_delete_owner_or_admin" on public.%1$s
        for delete to authenticated
        using (created_by = auth.uid() or public.is_admin());
    ', t);
  end loop;
end $$;

-- ============================================================================
-- 14. FIRST ADMIN (run manually after your first user signs up)
-- ============================================================================
-- update public.mrk_profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================================