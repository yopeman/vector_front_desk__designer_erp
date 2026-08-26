-- Vector Master Creative ERP System - Supabase Database Schema
-- This schema supports the UI from basic.html
-- No ENUM types, No RLS policies - Simple text columns for flexibility

-- ============================================================================
-- TABLES
-- ============================================================================

-- Prototype Requests Table
CREATE TABLE IF NOT EXISTS prototype_requests (
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
CREATE TABLE IF NOT EXISTS idea_hub (
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
CREATE TABLE IF NOT EXISTS design_bom (
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
CREATE TABLE IF NOT EXISTS staff_leaves (
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

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text NOT NULL,
  recipient text NOT NULL,
  message text NOT NULL,
  read_status boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  color text NOT NULL DEFAULT 'blue', -- 'blue', 'green', 'yellow', 'pink', 'purple'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL, -- 'Prototype', 'Idea', 'Design', 'Leave'
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Generating', -- 'Ready', 'Generating', 'Failed'
  generated_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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
DROP TRIGGER IF EXISTS update_prototype_requests_updated_at ON prototype_requests;
CREATE TRIGGER update_prototype_requests_updated_at BEFORE UPDATE ON prototype_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_idea_hub_updated_at ON idea_hub;
CREATE TRIGGER update_idea_hub_updated_at BEFORE UPDATE ON idea_hub
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_design_bom_updated_at ON design_bom;
CREATE TRIGGER update_design_bom_updated_at BEFORE UPDATE ON design_bom
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_leaves_updated_at ON staff_leaves;
CREATE TRIGGER update_staff_leaves_updated_at BEFORE UPDATE ON staff_leaves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

INSERT INTO prototype_requests (request_date, request_number, department, description, priority, deadline, assigned_technologist, status) VALUES
('2026-06-15', 'REQ-0941', 'Marketing Dept', 'Acrylic custom sign mockup fabrication', 'High', '2026-06-25', 'Engineer Alemu', 'On Progress')
ON CONFLICT (request_number) DO NOTHING;

INSERT INTO idea_hub (idea_date, idea_code, title, source, priority, target_date, estimated_cost, status) VALUES
('2026-06-14', 'IDEA-224', 'Modular LED Profile Box', 'Staff Generated', 'Normal', '2026-07-02', 12500, 'Approved')
ON CONFLICT (idea_code) DO NOTHING;

INSERT INTO design_bom (design_date, design_reference, project_title, priority, machine_routes, bom_item, bom_quantity, total_price, status) VALUES
('2026-06-12', 'DSGN-883', 'Vector Acrylic Frame', 'High', ARRAY['CNC Router', 'CO2 Laser'], 'Acrylic Sheet 3mm', 2, 900.00, 'Ready')
ON CONFLICT (design_reference) DO NOTHING;

INSERT INTO staff_leaves (application_date, leave_id, employee_name, leave_from, leave_to, leave_type, justification, status) VALUES
('2026-06-10', 'LEAVE-04', 'Girmawi Zekariyas', '2026-06-12', '2026-06-20', 'Annual Year Leave', 'Family personal matters administration', 'Under Review')
ON CONFLICT (leave_id) DO NOTHING;

INSERT INTO messages (sender, recipient, message, read_status) VALUES
('John Doe', 'Me', 'Can you review the new prototype design?', false),
('Jane Smith', 'Me', 'The BOM for DSGN-883 has been updated', true)
ON CONFLICT DO NOTHING;

INSERT INTO notes (title, content, color) VALUES
('Prototype Design Guidelines', 'Remember to follow the new design standards for all prototype requests. Check the material specifications before approval.', 'blue'),
('BOM Cost Review', 'Review the cost analysis for DSGN-883. Need to verify material pricing with suppliers.', 'yellow')
ON CONFLICT DO NOTHING;

INSERT INTO reports (name, type, description, status, generated_at) VALUES
('Prototype Status Report', 'Prototype', 'Summary of all prototype requests and their current status', 'Ready', '2026-06-15'),
('Idea Hub Analysis', 'Idea', 'Analysis of submitted ideas and their approval rates', 'Ready', '2026-06-14'),
('Design Workflow Summary', 'Design', 'Overview of design projects and BOM costs', 'Ready', '2026-06-13'),
('Staff Leave Overview', 'Leave', 'Summary of leave requests and approval statistics', 'Ready', '2026-06-12')
ON CONFLICT DO NOTHING;