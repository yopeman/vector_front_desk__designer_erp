-- ============================================================
-- Vector Front Desk ERP — Admin Machine Operator Role
-- Migration: 20260922110000
-- Description: Adds the 'admin_machine_operator' user role and
--              a table linking machine operators to machines
-- ============================================================

-- -----------------------------------------------------------
-- 1. Add admin_machine_operator to the users.role check
-- -----------------------------------------------------------
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'designer', 'front_desk', 'machine_operator', 'admin_machine_operator', 'finish', 'marketer', 'admin_marketer', 'finance', 'creative'));

-- -----------------------------------------------------------
-- 2. machine_operator_users
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_operator_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id  UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT machine_operator_users_machine_user_unique UNIQUE (machine_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_machine_operator_users_machine_id ON machine_operator_users(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_operator_users_user_id ON machine_operator_users(user_id);

-- -----------------------------------------------------------
-- 3. Auto-update updated_at
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_machine_operator_users_updated_at ON machine_operator_users;
CREATE TRIGGER update_machine_operator_users_updated_at BEFORE UPDATE ON machine_operator_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------
-- 4. Grant permissions
-- -----------------------------------------------------------
GRANT ALL PRIVILEGES ON machine_operator_users TO anon, authenticated;
GRANT ALL PRIVILEGES ON machine_operator_users TO service_role;