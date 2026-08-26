-- Vector Master Creative ERP System - Supabase Database Schema
-- Complete schema excluding messaging, notes, reports, and admin tables
-- No ENUM types, No RLS policies - Simple text columns for flexibility

-- ============================================================================
-- TABLES
-- ============================================================================

-- Prototype Requests Table
CREATE TABLE IF NOT EXISTS crt_prototype_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_date date NOT NULL,
  request_number text UNIQUE NOT NULL,
  department text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'Normal', -- 'High', 'Normal', 'Low'
  deadline date NOT NULL,
  assigned_technologist text NOT NULL,
  status text NOT NULL DEFAULT 'On Progress', -- 'On Progress', 'Completed', 'Pending', 'Rejected'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Idea Hub Table
CREATE TABLE IF NOT EXISTS crt_idea_hub (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_date date NOT NULL,
  idea_code text UNIQUE NOT NULL,
  title text NOT NULL,
  source text NOT NULL,
  priority text NOT NULL DEFAULT 'Normal', -- 'High', 'Normal'
  target_date date NOT NULL,
  estimated_cost numeric NOT NULL,
  status text NOT NULL DEFAULT 'Under Review', -- 'Approved', 'Under Review', 'Pending', 'Rejected'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Design & BOM Table
CREATE TABLE IF NOT EXISTS crt_design_bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_date date NOT NULL,
  design_reference text UNIQUE NOT NULL,
  project_title text NOT NULL,
  priority text NOT NULL DEFAULT 'Normal', -- 'High', 'Normal'
  machine_routes text[] NOT NULL,
  bom_item text NOT NULL,
  bom_quantity integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'Ready', -- 'Ready', 'In Progress', 'Completed', 'Pending'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Staff Leaves Table
CREATE TABLE IF NOT EXISTS crt_staff_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_date date NOT NULL,
  leave_id text UNIQUE NOT NULL,
  employee_name text NOT NULL,
  leave_from date NOT NULL,
  leave_to date NOT NULL,
  leave_type text NOT NULL, -- 'Annual Year Leave', 'Sick Medical Leave', 'Personal Casual Exception'
  justification text NOT NULL,
  status text NOT NULL DEFAULT 'Under Review', -- 'Under Review', 'Approved', 'Rejected', 'Cancelled'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- DISABLE RLS AND GRANT PERMISSIONS
-- ============================================================================

-- Disable Row Level Security on all tables
ALTER TABLE crt_prototype_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE crt_idea_hub DISABLE ROW LEVEL SECURITY;
ALTER TABLE crt_design_bom DISABLE ROW LEVEL SECURITY;
ALTER TABLE crt_staff_leaves DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users
GRANT ALL ON crt_prototype_requests TO authenticated;
GRANT ALL ON crt_idea_hub TO authenticated;
GRANT ALL ON crt_design_bom TO authenticated;
GRANT ALL ON crt_staff_leaves TO authenticated;

-- Grant full permissions to service_role
GRANT ALL ON crt_prototype_requests TO service_role;
GRANT ALL ON crt_idea_hub TO service_role;
GRANT ALL ON crt_design_bom TO service_role;
GRANT ALL ON crt_staff_leaves TO service_role;

-- ============================================================================
-- FUNCTIONS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (if they don't exist)
DROP TRIGGER IF EXISTS update_crt_prototype_requests_updated_at ON crt_prototype_requests;
CREATE TRIGGER update_crt_prototype_requests_updated_at BEFORE UPDATE ON crt_prototype_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crt_idea_hub_updated_at ON crt_idea_hub;
CREATE TRIGGER update_crt_idea_hub_updated_at BEFORE UPDATE ON crt_idea_hub
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crt_design_bom_updated_at ON crt_design_bom;
CREATE TRIGGER update_crt_design_bom_updated_at BEFORE UPDATE ON crt_design_bom
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crt_staff_leaves_updated_at ON crt_staff_leaves;
CREATE TRIGGER update_crt_staff_leaves_updated_at BEFORE UPDATE ON crt_staff_leaves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
