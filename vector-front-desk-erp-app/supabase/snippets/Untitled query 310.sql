-- ============================================================
-- Vector Front Desk ERP — Seed Machine Maintenance Data
-- Migration: 20260801_00001_seed_machine_maintenance_data
-- Description: Inserts mock machine and checklist data
-- ============================================================

-- Insert machines
INSERT INTO machines (id, name, machine_type, status, created_at, updated_at) VALUES
('420bc160-e787-47c4-80c8-b239ed4dacb7', 'p', 'zzzzzzzz', 'active', now(), now()),
('550bc160-e787-47c4-80c8-b239ed4dacb8', 'CNC-01', 'cnc', 'active', now(), now()),
('660bc160-e787-47c4-80c8-b239ed4dacb9', 'CO2-01', 'co2', 'active', now(), now()),
('770bc160-e787-47c4-80c8-b239ed4dacba', 'Fiber Cut-01', 'fiber-cut', 'active', now(), now()),
('880bc160-e787-47c4-80c8-b239ed4dacbb', 'UV-01', 'uv', 'active', now(), now()),
('990bc160-e787-47c4-80c8-b239ed4dacbc', '3D Print-01', '3d-print', 'active', now(), now()),
('aa0bc160-e787-47c4-80c8-b239ed4dacbd', 'Fiber Mark-01', 'fiber-mark', 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert CNC Machine checklists
INSERT INTO machine_maintenance_checklists (machine_id, checklist_type, checklist_name, checklist_items, created_at, updated_at) VALUES
('550bc160-e787-47c4-80c8-b239ed4dacb8', 'daily', 'CNC Machine Daily Checklist', 
 '["Clean dust and debris from the machine bed and work area", "Inspect spindle collet and tool holder for wear or dirt", "Check tool bits for sharpness (replace if needed)", "Verify proper air pressure (if pneumatic system is used)", "Inspect vacuum system or dust collector for blockages (if mounted)", "Check emergency stop and safety switches are working", "Lubricate moving parts if required (per manufacturer guidelines)"]'::jsonb,
 now(), now()),
('550bc160-e787-47c4-80c8-b239ed4dacb8', 'weekly', 'CNC Machine Weekly Checklist',
 '["Inspect spindle for unusual noise or vibration", "Check and tighten loose bolts, screws, or connections", "Inspect belts and pulleys for wear or misalignment", "Clean linear rails and ball screws; apply lubricant if needed", "Check coolant or lubrication levels (if applicable)", "Test machine homing and limit switches", "Inspect dust extraction hoses for leaks (if applicable)"]'::jsonb,
 now(), now()),
('550bc160-e787-47c4-80c8-b239ed4dacb8', 'monthly', 'CNC Machine Monthly Checklist',
 '["Check spindle runout and alignment", "Inspect motor couplings for looseness", "Clean electrical cabinet filters and fans", "Verify software/controller settings backup", "Check grounding and wiring connections", "Inspect tool changer (if equipped) for smooth operation", "Run a test job to ensure accuracy and repeatability"]'::jsonb,
 now(), now())
ON CONFLICT DO NOTHING;

-- Insert CO2 Machine checklists
INSERT INTO machine_maintenance_checklists (machine_id, checklist_type, checklist_name, checklist_items, created_at, updated_at) VALUES
('660bc160-e787-47c4-80c8-b239ed4dacb9', 'daily', 'CO2 Machine Daily Checklist',
 '["Check water chiller (temperature, water level, no bubbles, no leaks)", "Inspect water hoses for kinks, leaks, or blockages", "Clean mirrors and focusing lens with lens cleaner and lint-free swabs", "Verify air assist flow is strong and stable", "Check ventilation/exhaust system is working properly", "Remove dust/debris from work area", "Power on machine and confirm laser fires properly at low power test"]'::jsonb,
 now(), now()),
('660bc160-e787-47c4-80c8-b239ed4dacb9', 'weekly', 'CO2 Machine Weekly Checklist',
 '["Inspect laser tube for cracks, condensation, or discoloration", "Check mirror alignment using tape test on all three mirrors", "Clean fan filters and dust from electronics cabinet", "Check belt tension (X & Y axis) and adjust if loose", "Inspect rails and bearings for dirt or wear", "Apply light lubricant to linear guides/rails (if manufacturer allows)", "Test emergency stop button and safety switches"]'::jsonb,
 now(), now()),
('660bc160-e787-47c4-80c8-b239ed4dacb9', 'monthly', 'CO2 Machine Monthly Checklist',
 '["Check spindle runout and alignment", "Inspect motor couplings for looseness", "Clean electrical cabinet filters and fans", "Verify software/controller settings backup", "Check grounding and wiring connections", "Inspect tool changer (if equipped) for smooth operation", "Run a test job to ensure accuracy and repeatability"]'::jsonb,
 now(), now())
ON CONFLICT DO NOTHING;

-- Insert Fiber Cutting Machine checklists
INSERT INTO machine_maintenance_checklists (machine_id, checklist_type, checklist_name, checklist_items, created_at, updated_at) VALUES
('770bc160-e787-47c4-80c8-b239ed4dacba', 'daily', 'Fiber Cutting Machine Daily Checklist',
 '["Check power-on self-test — Ensure system initializes without error codes", "Clean lens and protective window — Use lens wipes or alcohol swabs; avoid fingerprints", "Inspect nozzle and cutting head — Remove dross or debris; check for damage", "Check focus lens alignment — Verify focus height is calibrated", "Check assist gas (O2/N2) pressure — Maintain within recommended levels", "Verify water chiller temperature — Keep between 20–25°C", "Drain water filter or separator — Remove condensed moisture", "Clean worktable and cutting bed — Remove slag and metal pieces", "Inspect fiber cable — Ensure no sharp bends or mechanical stress", "Test emergency stop button — Confirm it cuts power immediately"]'::jsonb,
 now(), now()),
('770bc160-e787-47c4-80c8-b239ed4dacba', 'weekly', 'Fiber Cutting Machine Weekly Checklist',
 '["Inspect air filters — Clean or replace if clogged", "Check lens alignment (optical path) — Verify beam center using alignment paper", "Lubricate linear guides and bearings — Use light machine oil or grease", "Tighten screws and connections — Especially around head, nozzle, and gantry", "Inspect exhaust and ventilation system — Remove dust or metal powder buildup", "Clean sensors (Z-axis/focus sensor) — Use dry air or soft cloth"]'::jsonb,
 now(), now()),
('770bc160-e787-47c4-80c8-b239ed4dacba', 'monthly', 'Fiber Cutting Machine Monthly Checklist',
 '["Check cooling water quality — Replace with deionized or distilled water", "Inspect water chiller filters — Clean or replace", "Inspect servo motor & belts — Check for wear or abnormal noise", "Check grounding and electrical terminals — Tighten and ensure good connection", "Update controller firmware (if needed) — Consult manufacturer before update", "Inspect laser protective glass — Replace if discolored or cracked"]'::jsonb,
 now(), now())
ON CONFLICT DO NOTHING;

-- Insert UV Machine checklists
INSERT INTO machine_maintenance_checklists (machine_id, checklist_type, checklist_name, checklist_items, created_at, updated_at) VALUES
('880bc160-e787-47c4-80c8-b239ed4dacbb', 'daily', 'UV Machine Daily Checklist',
 '["Power on printer and run nozzle check before printing", "Clean printhead surface with recommended cleaning solution", "Wipe capping station and wiper blade to remove ink buildup", "Shake UV ink bottles gently to prevent pigment settling", "Check ink levels and refill/replace if low", "Inspect UV lamp/LED curing unit for functionality", "Clean platen and work area from dust, ink, or debris"]'::jsonb,
 now(), now()),
('880bc160-e787-47c4-80c8-b239ed4dacbb', 'weekly', 'UV Machine Weekly Checklist',
 '["Perform full printhead cleaning cycle", "Check ink lines and dampers for air bubbles or leaks", "Clean encoder strip and encoder wheel carefully", "Check and clean ventilation fans and filters", "Inspect carriage movement for smooth operation", "Run nozzle alignment test and adjust if needed"]'::jsonb,
 now(), now()),
('880bc160-e787-47c4-80c8-b239ed4dacbb', 'monthly', 'UV Machine Monthly Checklist',
 '["Deep clean printhead and flush with cleaning solution (if required)", "Inspect capping station seals for wear or cracks", "Replace wiper blade if worn or damaged", "Check UV lamp/LED curing hours and replace if near end of life", "Verify RIP software and firmware are up to date", "Clean ink waste tank and reset waste counter if necessary"]'::jsonb,
 now(), now())
ON CONFLICT DO NOTHING;

-- Insert 3D Printing Machine checklists
INSERT INTO machine_maintenance_checklists (machine_id, checklist_type, checklist_name, checklist_items, created_at, updated_at) VALUES
('990bc160-e787-47c4-80c8-b239ed4dacbc', 'daily', '3D Printing Machine Daily Checklist',
 '["Check bed level and nozzle height before printing", "Clean print bed surface and remove any residue or filament", "Inspect filament spool for tangles or moisture", "Run nozzle purge before each print", "Check for proper first layer adhesion", "Wipe rails and rods to remove dust or filament debris"]'::jsonb,
 now(), now()),
('990bc160-e787-47c4-80c8-b239ed4dacbc', 'weekly', '3D Printing Machine Weekly Checklist',
 '["Perform nozzle cleaning with needle or cleaning filament", "Inspect and clean the extruder gear teeth", "Check all belts for tension and signs of wear", "Clean cooling fans and ventilation openings", "Verify proper lubrication of linear rods or lead screws", "Inspect all wiring for loose or frayed connections"]'::jsonb,
 now(), now()),
('990bc160-e787-47c4-80c8-b239ed4dacbc', 'monthly', '3D Printing Machine Monthly Checklist',
 '["Deep clean nozzle (cold pull or disassembly if needed)", "Calibrate bed leveling and nozzle offset manually", "Check and tighten all frame screws and bolts", "Inspect PTFE tubes for wear or blockage", "Clean build surface thoroughly or replace if worn", "Update firmware and slicer software if needed"]'::jsonb,
 now(), now())
ON CONFLICT DO NOTHING;

-- Insert Fiber Marking Machine checklists
INSERT INTO machine_maintenance_checklists (machine_id, checklist_type, checklist_name, checklist_items, created_at, updated_at) VALUES
('aa0bc160-e787-47c4-80c8-b239ed4dacbd', 'daily', 'Fiber Marking Machine Daily Checklist',
 '["Power on self-test execution validation", "Clean f-theta scan lens using optical wipes", "Verify workspace alignment laser works", "Clean structural external frame bed area"]'::jsonb,
 now(), now()),
('aa0bc160-e787-47c4-80c8-b239ed4dacbd', 'weekly', 'Fiber Marking Machine Weekly Checklist',
 '["Check electrical power plug connections stability", "Inspect software focus heights metrics verification"]'::jsonb,
 now(), now()),
('aa0bc160-e787-47c4-80c8-b239ed4dacbd', 'monthly', 'Fiber Marking Machine Monthly Checklist',
 '["Complete general backup calibrations profiling parameters log"]'::jsonb,
 now(), now())
ON CONFLICT DO NOTHING;