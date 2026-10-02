-- Remove row level security from the push device registry
alter table public.push_devices disable row level security;
