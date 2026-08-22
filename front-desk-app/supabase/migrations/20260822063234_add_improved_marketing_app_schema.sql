-- ============================================================
-- MARKETING MODULE SCHEMA (mrkt_* prefix)
-- All tables with RLS disabled, and "IF NOT EXISTS" clauses.
-- No triggers or trigger functions included.
-- ============================================================

-- ============================================================
-- 1. ENUMS (with conditional creation)
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
        CREATE TYPE campaign_status AS ENUM ('planned', 'active', 'completed', 'on_hold', 'archived');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM ('content_production', 'social_media', 'website', 'paid_ad', 'visit', 'meeting', 'demo', 'event', 'follow_up', 'other');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_status') THEN
        CREATE TYPE activity_status AS ENUM ('planned', 'in_progress', 'completed', 'overdue');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposal_status') THEN
        CREATE TYPE proposal_status AS ENUM ('draft', 'submitted', 'follow_up', 'accepted', 'rejected', 'on_hold');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proforma_status') THEN
        CREATE TYPE proforma_status AS ENUM ('requested', 'submitted', 'follow_up', 'accepted', 'rejected', 'on_hold');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tender_status') THEN
        CREATE TYPE tender_status AS ENUM ('opportunity', 'preparation', 'submitted', 'follow_up', 'awarded', 'lost', 'on_hold');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
        CREATE TYPE expense_category AS ENUM ('advertising', 'content', 'events', 'travel', 'software', 'personnel', 'other');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insight_type') THEN
        CREATE TYPE insight_type AS ENUM ('customer_need', 'competitor', 'market_trend', 'new_opportunity');
    END IF;
END$$;

-- ============================================================
-- 2. TABLES (with mrkt_ prefix)
-- ============================================================

-- 2.1 PLANS (hierarchical)
CREATE TABLE IF NOT EXISTS mrkt_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('annual', 'monthly', 'weekly', 'quarterly')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    parent_plan_id UUID REFERENCES mrkt_plans(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    target_revenue NUMERIC(12, 2) DEFAULT 0,
    target_leads INTEGER DEFAULT 0,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 CAMPAIGNS
CREATE TABLE IF NOT EXISTS mrkt_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status campaign_status DEFAULT 'planned',
    start_date DATE,
    end_date DATE,
    budget_estimated NUMERIC(12, 2) DEFAULT 0,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    plan_id UUID REFERENCES mrkt_plans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 CAMPAIGN TARGETS (KPIs)
CREATE TABLE IF NOT EXISTS mrkt_campaign_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES mrkt_campaigns(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    target_value NUMERIC(12, 2),
    actual_value NUMERIC(12, 2) DEFAULT 0,
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 ACTIVITIES
CREATE TABLE IF NOT EXISTS mrkt_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES mrkt_campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type activity_type NOT NULL,
    status activity_status DEFAULT 'planned',
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    location TEXT,
    notes TEXT,
    checklists JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 PROPOSALS
CREATE TABLE IF NOT EXISTS mrkt_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES mrkt_campaigns(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    amount NUMERIC(12, 2) DEFAULT 0,
    status proposal_status DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    follow_up_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 PROFORMAS
CREATE TABLE IF NOT EXISTS mrkt_proformas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES mrkt_campaigns(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    amount NUMERIC(12, 2) DEFAULT 0,
    status proforma_status DEFAULT 'requested',
    requested_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 TENDERS
CREATE TABLE IF NOT EXISTS mrkt_tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES mrkt_campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    client_name TEXT,
    amount NUMERIC(12, 2) DEFAULT 0,
    status tender_status DEFAULT 'opportunity',
    deadline DATE,
    submitted_at TIMESTAMPTZ,
    awarded_at TIMESTAMPTZ,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 PRODUCTS / SERVICES
CREATE TABLE IF NOT EXISTS mrkt_products_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('product', 'service')),
    category TEXT,
    unit_cost NUMERIC(12, 2) DEFAULT 0,
    unit_price NUMERIC(12, 2) DEFAULT 0,
    sku TEXT UNIQUE,
    marketing TEXT,
    strategy TEXT,
    date DATE,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 EXPENSES
CREATE TABLE IF NOT EXISTS mrkt_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES mrkt_campaigns(id) ON DELETE CASCADE,
    category expense_category NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 MARKET INSIGHTS
CREATE TABLE IF NOT EXISTS mrkt_market_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type insight_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT,
    date_identified DATE DEFAULT CURRENT_DATE,
    relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10),
    campaign_id UUID REFERENCES mrkt_campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 PROPOSAL ITEMS
CREATE TABLE IF NOT EXISTS mrkt_proposal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES mrkt_proposals(id) ON DELETE CASCADE,
    product_service_id UUID REFERENCES mrkt_products_services(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 PROFORMA ITEMS
CREATE TABLE IF NOT EXISTS mrkt_proforma_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proforma_id UUID REFERENCES mrkt_proformas(id) ON DELETE CASCADE,
    product_service_id UUID REFERENCES mrkt_products_services(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. DISABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================
ALTER TABLE mrkt_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_campaign_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_proformas DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_tenders DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_products_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_market_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_proposal_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE mrkt_proforma_items DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. PERFORMANCE INDEXES (with IF NOT EXISTS)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mrkt_plans_parent ON mrkt_plans(parent_plan_id);
CREATE INDEX IF NOT EXISTS idx_mrkt_plans_type ON mrkt_plans(type);
CREATE INDEX IF NOT EXISTS idx_mrkt_plans_dates ON mrkt_plans(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_mrkt_campaigns_status ON mrkt_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_mrkt_campaigns_owner ON mrkt_campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_mrkt_campaigns_plan ON mrkt_campaigns(plan_id);

CREATE INDEX IF NOT EXISTS idx_mrkt_activities_campaign ON mrkt_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mrkt_activities_status ON mrkt_activities(status);
CREATE INDEX IF NOT EXISTS idx_mrkt_activities_assigned ON mrkt_activities(assigned_to);

CREATE INDEX IF NOT EXISTS idx_mrkt_proposals_campaign ON mrkt_proposals(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mrkt_proposals_status ON mrkt_proposals(status);

CREATE INDEX IF NOT EXISTS idx_mrkt_proformas_campaign ON mrkt_proformas(campaign_id);

CREATE INDEX IF NOT EXISTS idx_mrkt_tenders_campaign ON mrkt_tenders(campaign_id);

CREATE INDEX IF NOT EXISTS idx_mrkt_expenses_campaign ON mrkt_expenses(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mrkt_expenses_date ON mrkt_expenses(expense_date);

CREATE INDEX IF NOT EXISTS idx_mrkt_market_insights_type ON mrkt_market_insights(type);

-- ============================================================
-- 5. STORAGE BUCKET FOR ACTIVITY ATTACHMENTS
-- ============================================================
-- Create bucket if not exists (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-attachments', 'activity-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Grant all permissions on storage.objects to authenticated users
GRANT ALL ON storage.objects TO authenticated;

-- Drop existing policies if they exist (to avoid errors on rerun)
DROP POLICY IF EXISTS "Authenticated users can upload activity attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view activity attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete activity attachments" ON storage.objects;

-- Policies for the bucket
CREATE POLICY "Authenticated users can upload activity attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'activity-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view activity attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'activity-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete activity attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'activity-attachments'
  AND auth.role() = 'authenticated'
);
