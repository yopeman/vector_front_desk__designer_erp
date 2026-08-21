-- ==================================================
-- ADD PLANS TABLE AND CAMPAIGN PLAN_ID COLUMN
-- ==================================================

-- 1. CREATE THE PLANS TABLE
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('annual', 'monthly', 'weekly', 'quarterly')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    
    -- Hierarchical self-reference
    parent_plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    
    -- Time boundaries
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Strategic targets (high-level)
    target_revenue NUMERIC(12, 2) DEFAULT 0,
    target_leads INTEGER DEFAULT 0,
    
    -- Ownership
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADD PLAN_ID COLUMN TO CAMPAIGNS TABLE
ALTER TABLE campaigns 
ADD COLUMN plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

-- 3. ADD INDEXES FOR PERFORMANCE
CREATE INDEX idx_plans_parent ON plans(parent_plan_id);
CREATE INDEX idx_plans_type ON plans(type);
CREATE INDEX idx_plans_dates ON plans(start_date, end_date);
CREATE INDEX idx_campaigns_plan ON campaigns(plan_id);

-- 4. ADD AUTO-UPDATE TRIGGER FOR PLANS TABLE
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
