-- Fix department foreign key to reference departments table
-- -----------------------------------------------------------

-- Drop the existing department_id column (with wrong foreign key)
ALTER TABLE site_visits DROP COLUMN IF EXISTS department_id;

-- Re-add department_id with correct foreign key to departments
ALTER TABLE site_visits ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
