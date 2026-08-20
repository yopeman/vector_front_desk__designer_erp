-- ==================================================
-- 1. ENABLE EXTENSIONS
-- ==================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================
-- 2. CREATE ENUMS (Mirroring your PDF statuses)
-- ==================================================
CREATE TYPE campaign_status AS ENUM ('planned', 'active', 'completed', 'on_hold', 'archived');
CREATE TYPE activity_type AS ENUM ('content_production', 'social_media', 'website', 'paid_ad', 'visit', 'meeting', 'demo', 'event', 'follow_up', 'other');
CREATE TYPE activity_status AS ENUM ('planned', 'in_progress', 'completed', 'overdue');
CREATE TYPE proposal_status AS ENUM ('draft', 'submitted', 'follow_up', 'accepted', 'rejected', 'on_hold');
CREATE TYPE proforma_status AS ENUM ('requested', 'submitted', 'follow_up', 'accepted', 'rejected', 'on_hold');
CREATE TYPE tender_status AS ENUM ('opportunity', 'preparation', 'submitted', 'follow_up', 'awarded', 'lost', 'on_hold');
CREATE TYPE expense_category AS ENUM ('advertising', 'content', 'events', 'travel', 'software', 'personnel', 'other');
CREATE TYPE insight_type AS ENUM ('customer_need', 'competitor', 'market_trend', 'new_opportunity');

-- ==================================================
-- 3. CORE TABLES
-- ==================================================

-- 3.1 CAMPAIGNS (Plans, Annual/Monthly/Weekly)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status campaign_status DEFAULT 'planned',
    start_date DATE,
    end_date DATE,
    budget_estimated NUMERIC(12, 2) DEFAULT 0,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 CAMPAIGN TARGETS (KPIs: Leads, Conversions, ROI, etc.)
CREATE TABLE campaign_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    metric TEXT NOT NULL, -- e.g., 'leads', 'conversions', 'revenue', 'impressions', 'engagement'
    target_value NUMERIC(12, 2),
    actual_value NUMERIC(12, 2) DEFAULT 0,
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 UNIFIED ACTIVITIES (Digital + Physical Marketing)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type activity_type NOT NULL,
    status activity_status DEFAULT 'planned',
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    location TEXT, -- URL for digital, address for physical
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 PROPOSALS
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    amount NUMERIC(12, 2) DEFAULT 0,
    status proposal_status DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    follow_up_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 PROFORMAS (Preliminary Invoices/Quotations)
CREATE TABLE proformas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    amount NUMERIC(12, 2) DEFAULT 0,
    status proforma_status DEFAULT 'requested',
    requested_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 TENDERS
CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    client_name TEXT,
    amount NUMERIC(12, 2) DEFAULT 0,
    status tender_status DEFAULT 'opportunity',
    deadline DATE,
    submitted_at TIMESTAMPTZ,
    awarded_at TIMESTAMPTZ,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 PRODUCTS / SERVICES CATALOG
CREATE TABLE products_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('product', 'service')),
    category TEXT,
    unit_cost NUMERIC(12, 2) DEFAULT 0,
    unit_price NUMERIC(12, 2) DEFAULT 0,
    sku TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 EXPENSES (Actual Marketing Costs)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    category expense_category NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 MARKET RESEARCH / INSIGHTS
CREATE TABLE market_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type insight_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT,
    date_identified DATE DEFAULT CURRENT_DATE,
    relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 LINE ITEMS (for proposals/proformas – optional but completes the module)
CREATE TABLE proposal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    product_service_id UUID REFERENCES products_services(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proforma_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proforma_id UUID REFERENCES proformas(id) ON DELETE CASCADE,
    product_service_id UUID REFERENCES products_services(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- 4. AUTO-UPDATE TIMESTAMPS (Supabase helper)
-- ==================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_modified_column();
        ', t, t);
    END LOOP;
END;
$$;

-- ==================================================
-- 5. PERFORMANCE INDEXES
-- ==================================================
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX idx_activities_campaign ON activities(campaign_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_assigned ON activities(assigned_to);
CREATE INDEX idx_proposals_campaign ON proposals(campaign_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proformas_campaign ON proformas(campaign_id);
CREATE INDEX idx_tenders_campaign ON tenders(campaign_id);
CREATE INDEX idx_expenses_campaign ON expenses(campaign_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_market_insights_type ON market_insights(type);
