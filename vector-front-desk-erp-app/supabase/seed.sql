-- ============================================================
-- Seed: Create the default admin user
-- This runs when `supabase start` is executed (db reset).
-- Only inserts if no admin exists yet.
-- ============================================================

-- Insert a default admin user into the auth system
-- Note: This requires the user to exist in auth.users first.
-- For a fresh start, we insert the profile directly.
-- The admin must sign up through the app, then we update the role.
-- This seed creates a placeholder that the signup flow can reference.

-- Alternatively, create the admin auth user automatically:
-- (requires the pgcrypto extension which is already enabled)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role_id
)
SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@vectorerp.com',
    crypt('Admin@2024', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"System Admin"}',
    false,
    (SELECT id FROM auth.roles WHERE name = 'authenticated')
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@vectorerp.com'
);

-- Insert corresponding profile into public.users with admin role
INSERT INTO public.users (id, username, email, role, created_at, updated_at)
SELECT
    id,
    'admin',
    email,
    'admin',
    now(),
    now()
FROM auth.users
WHERE email = 'admin@vectorerp.com'
  AND NOT EXISTS (
      SELECT 1 FROM public.users WHERE email = 'admin@vectorerp.com'
);