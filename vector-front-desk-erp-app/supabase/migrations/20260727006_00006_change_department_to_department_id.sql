-- Change department column to department_id with foreign key to departments
-- -----------------------------------------------------------

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default departments
INSERT INTO departments (name) VALUES
    ('Sales'),
    ('Marketing'),
    ('Finance'),
    ('Operations'),
    ('IT'),
    ('Human Resources'),
    ('Production'),
    ('Logistics')
ON CONFLICT (name) DO NOTHING;

-- First, drop the old department column
ALTER TABLE site_visits DROP COLUMN IF EXISTS department;

-- Add new department_id column with foreign key to departments
ALTER TABLE site_visits ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
