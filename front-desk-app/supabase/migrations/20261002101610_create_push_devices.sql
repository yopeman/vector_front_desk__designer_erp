-- Push notification device registry (Supabase / Postgres)
create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  platform text not null default 'unknown',
  user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_devices_user_id_idx on public.push_devices (user_id);

alter table public.push_devices enable row level security;

-- Read-only access for the mobile client / anon role. Writes stay server-side
-- using the service-role key.
grant select on public.push_devices to anon, authenticated;

create or replace function public.touch_push_devices_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists push_devices_touch_updated_at on public.push_devices;
create trigger push_devices_touch_updated_at
before update on public.push_devices
for each row execute function public.touch_push_devices_updated_at();