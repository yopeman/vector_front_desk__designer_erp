-- ============================================================================
-- Vector Master ERP — Marketing Schema (integrated with existing `users` table)
-- Migration: 20260803_00016_add_marketing_schema
-- ============================================================================
-- This migration:
--   1. Extends the existing `users.role` CHECK constraint to add the
--      `marketer` and `admin_marketer` roles.
--   2. Creates the marketing tables (market requests, clients, invoices,
--      research logins, digital logs, tenders, feedbacks).
--   3. Reuses the existing `users` table (id = auth.users.id) for all
--      created_by / assigned_to / approved_by references — no separate
--      `mrk_profiles` table is created.
--   4. Follows the app's existing no-RLS pattern (see migration
--      20260727005_00005_disable_rls.sql). Role-based access is enforced
--      in the application layer, consistent with the rest of the app.
--
-- Roles:
--   admin          -> global admin (front-desk app). Can also approve/reject
--                     market requests and manage users.
--   admin_marketer -> marketing admin. Everything a marketer can do, PLUS
--                     approve/reject market requests.
--   marketer       -> full day-to-day marketing operations (market requests,
--                     clients, invoices, research, digital log, tenders,
--                     feedback) but cannot approve market requests.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND USERS ROLE CHECK CONSTRAINT
-- ----------------------------------------------------------------------------
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'designer', 'front_desk', 'machine_operator', 'marketer', 'admin_marketer'));

-- ----------------------------------------------------------------------------
-- 2. ENUM TYPES
-- ----------------------------------------------------------------------------
create type public.request_status   as enum ('pending', 'approved', 'rejected');
create type public.priority_level   as enum ('low', 'medium', 'high');
create type public.client_type      as enum ('organization', 'personal');
create type public.client_level     as enum ('standard', 'premium');
create type public.vat_status       as enum ('with_vat', 'without_vat');
create type public.share_target     as enum ('marketing_manager', 'management');

-- ----------------------------------------------------------------------------
-- 3. HELPER: updated_at trigger
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
-- 4. ROLE-CHECK HELPERS (query the existing `users` table)
--    is_admin() returns true for BOTH the global 'admin' and 'admin_marketer',
--    so a global admin can also approve market requests.
-- ----------------------------------------------------------------------------
create or replace function public.current_role()
returns text
language sql
stable
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((select role from public.users where id = auth.uid()) in ('admin', 'admin_marketer'), false);
$$;

-- ----------------------------------------------------------------------------
-- 5. MARKET REQUESTS  (admin/admin_marketer-only approval)
-- ----------------------------------------------------------------------------
create table public.mrk_market_requests (
  id             uuid primary key default gen_random_uuid(),
  request_no     text not null unique,
  request_date   date not null default current_date,
  request_type   text not null,
  description    text,
  priority       public.priority_level not null default 'medium',
  assigned_to    uuid references public.users (id),
  due_date       date,
  status         public.request_status not null default 'pending',
  file_url       text,
  voice_note_url text,
  created_by     uuid not null references public.users (id) default auth.uid(),
  approved_by    uuid references public.users (id),
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
  created_by      uuid not null references public.users (id) default auth.uid(),
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
  created_by     uuid not null references public.users (id) default auth.uid(),
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
  created_by   uuid not null references public.users (id) default auth.uid(),
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
  created_by     uuid not null references public.users (id) default auth.uid(),
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
  created_by    uuid not null references public.users (id) default auth.uid(),
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
  created_by     uuid not null references public.users (id) default auth.uid(),
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
-- NOTE: RLS is intentionally NOT enabled on the marketing tables, to stay
-- consistent with the rest of the app (see migration
-- 20260727005_00005_disable_rls.sql). Role-based access control is enforced
-- in the application layer (e.g. via the existing RoleRouter / ProtectedRoute
-- components and the is_admin() / current_role() helpers above).
-- ============================================================================

-- ============================================================================
-- 14. FIRST MARKETING ADMIN (run manually after your first user signs up)
-- ============================================================================
-- update public.users set role = 'admin_marketer' where email = 'you@example.com';
-- ============================================================================