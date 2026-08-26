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

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

INSERT INTO crt_prototype_requests (request_date, request_number, department, description, priority, deadline, assigned_technologist, status) VALUES
('2026-06-15', 'REQ-0941', 'Marketing Dept', 'Acrylic custom sign mockup fabrication', 'High', '2026-06-25', 'Engineer Alemu', 'On Progress')
ON CONFLICT (request_number) DO NOTHING;

INSERT INTO crt_idea_hub (idea_date, idea_code, title, source, priority, target_date, estimated_cost, status) VALUES
('2026-06-14', 'IDEA-224', 'Modular LED Profile Box', 'Staff Generated', 'Normal', '2026-07-02', 12500, 'Approved')
ON CONFLICT (idea_code) DO NOTHING;

INSERT INTO crt_design_bom (design_date, design_reference, project_title, priority, machine_routes, bom_item, bom_quantity, total_price, status) VALUES
('2026-06-12', 'DSGN-883', 'Vector Acrylic Frame', 'High', ARRAY['CNC Router', 'CO2 Laser'], 'Acrylic Sheet 3mm', 2, 900.00, 'Ready')
ON CONFLICT (design_reference) DO NOTHING;

INSERT INTO crt_staff_leaves (application_date, leave_id, employee_name, leave_from, leave_to, leave_type, justification, status) VALUES
('2026-06-10', 'LEAVE-04', 'Girmawi Zekariyas', '2026-06-12', '2026-06-20', 'Annual Year Leave', 'Family personal matters administration', 'Under Review')
ON CONFLICT (leave_id) DO NOTHING;
