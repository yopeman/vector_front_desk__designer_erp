-- Change department column to department_id with foreign key to departments
-- -----------------------------------------------------------

-- Create departments table (skipped if already created in initial schema)
CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure unique constraint on departments.name exists.
-- The table may have been created by the initial schema without a UNIQUE
-- constraint, in which case CREATE TABLE IF NOT EXISTS above is skipped and
-- the constraint must be added explicitly for ON CONFLICT (name) to work.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'departments_name_key'
          AND conrelid = 'departments'::regclass
    ) THEN
        ALTER TABLE departments ADD CONSTRAINT departments_name_key UNIQUE (name);
    END IF;
END $$;

-- First, drop the old department column
ALTER TABLE site_visits DROP COLUMN IF EXISTS department;

-- Add new department_id column with foreign key to departments
ALTER TABLE site_visits ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
