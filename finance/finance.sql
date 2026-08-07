-- ============================================================
-- finance.sql
-- Standalone Finance / Accounting Module
-- Compatible with PostgreSQL 13+ (requires pgcrypto for gen_random_uuid)
-- ============================================================

-- Enable UUID generation if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SCHEMA
-- ============================================================
CREATE SCHEMA IF NOT EXISTS finance;
ALTER SCHEMA finance OWNER TO postgres;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE finance.account_type AS ENUM (
    'Asset',
    'Liability',
    'Equity',
    'Revenue',
    'Expense'
);

CREATE TYPE finance.purchase_type AS ENUM (
    'Cash',
    'Credit'
);

CREATE TYPE finance.sales_type AS ENUM (
    'Cash',
    'Credit'
);

CREATE TYPE finance.vat_type AS ENUM (
    'VAT',
    'Exempted'
);

CREATE TYPE finance.receipt_source AS ENUM (
    'Manual',
    'FS'   -- Fiscal / cash register
);

CREATE TYPE finance.vat_withholding AS ENUM (
    'No Withholding',
    '3%',
    '7.5%',
    '30%'
);

CREATE TYPE finance.journal_status AS ENUM (
    'Draft',
    'Posted'
);

CREATE TYPE finance.payroll_status AS ENUM (
    'Draft',
    'Approved',
    'Paid'
);

-- ============================================================
-- HELPER FUNCTION FOR updated_at TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION finance.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Chart of Accounts
CREATE TABLE finance.gl_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code    VARCHAR(20) NOT NULL UNIQUE,
    account_name    VARCHAR(255) NOT NULL,
    account_type    finance.account_type NOT NULL,
    parent_id       UUID REFERENCES finance.gl_accounts(id) ON DELETE SET NULL,
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID,   -- application-level reference (no FK)
    updated_by      UUID
);

-- 2. Purchases (header)
CREATE TABLE finance.purchases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_no     VARCHAR(50) NOT NULL UNIQUE,
    purchase_type   finance.purchase_type NOT NULL,
    seller_tin      VARCHAR(50),
    seller_name     VARCHAR(255) NOT NULL,
    seller_id       UUID,   -- application-level reference to Suppliers (no FK)
    purchase_date   DATE NOT NULL,
    receipt_source  finance.receipt_source NOT NULL,
    reference_no    VARCHAR(100),   -- seller's invoice / reference
    gl_account_id   UUID NOT NULL REFERENCES finance.gl_accounts(id),
    vat_type        finance.vat_type NOT NULL,
    subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
    vat_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,
    status          VARCHAR(50) DEFAULT 'Draft',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID
);

-- 3. Purchase Items (line items)
CREATE TABLE finance.purchase_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id     UUID NOT NULL REFERENCES finance.purchases(id) ON DELETE CASCADE,
    item_id         UUID,   -- application-level reference to Stock Items (no FK)
    item_name       VARCHAR(255) NOT NULL,
    description     TEXT,
    quantity        NUMERIC(15,2) NOT NULL CHECK (quantity >= 0),
    unit_price      NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
    total           NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    gl_account_id   UUID REFERENCES finance.gl_accounts(id),  -- override if needed
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Sales (header)
CREATE TABLE finance.sales (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_no            VARCHAR(50) NOT NULL UNIQUE,
    sales_type          finance.sales_type NOT NULL,
    sales_category      VARCHAR(50) NOT NULL,   -- e.g., Goods, Services
    cash_received       NUMERIC(15,2) DEFAULT 0,
    customer_tin        VARCHAR(50),
    customer_name       VARCHAR(255) NOT NULL,
    customer_id         UUID,   -- application-level reference to Clients (no FK)
    sales_date          DATE NOT NULL,
    receipt_source      finance.receipt_source NOT NULL,
    vat_withholding     finance.vat_withholding NOT NULL DEFAULT 'No Withholding',
    subtotal            NUMERIC(15,2) NOT NULL DEFAULT 0,
    vat_amount          NUMERIC(15,2) NOT NULL DEFAULT 0,
    withholding_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_amount          NUMERIC(15,2) NOT NULL DEFAULT 0,   -- after withholding
    status              VARCHAR(50) DEFAULT 'Draft',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID,
    updated_by          UUID
);

-- 5. Sales Items (line items)
CREATE TABLE finance.sales_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_id        UUID NOT NULL REFERENCES finance.sales(id) ON DELETE CASCADE,
    item_id         UUID,   -- application-level reference to Stock Items (no FK)
    item_name       VARCHAR(255) NOT NULL,
    quantity        NUMERIC(15,2) NOT NULL CHECK (quantity >= 0),
    unit_price      NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
    tax_rate        NUMERIC(5,2) DEFAULT 15.00,   -- VAT percentage
    total           NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    gl_account_id   UUID REFERENCES finance.gl_accounts(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. General Journal (header)
CREATE TABLE finance.journals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_no      VARCHAR(50) NOT NULL UNIQUE,
    journal_date    DATE NOT NULL,
    reference       VARCHAR(100),   -- manual reference or source document
    description     TEXT,
    status          finance.journal_status NOT NULL DEFAULT 'Draft',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID
);

-- 7. Journal Lines (double-entry)
CREATE TABLE finance.journal_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id      UUID NOT NULL REFERENCES finance.journals(id) ON DELETE CASCADE,
    gl_account_id   UUID NOT NULL REFERENCES finance.gl_accounts(id),
    description     TEXT,
    debit           NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit          NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Payroll
CREATE TABLE finance.payroll (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID NOT NULL,   -- application-level reference to Employees (no FK)
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    basic_salary        NUMERIC(15,2) NOT NULL DEFAULT 0,
    transport_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
    telephone_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
    overtime            NUMERIC(15,2) NOT NULL DEFAULT 0,
    other_earnings      NUMERIC(15,2) NOT NULL DEFAULT 0,
    gross_salary        NUMERIC(15,2) GENERATED ALWAYS AS (
        basic_salary + transport_allowance + telephone_allowance + overtime + other_earnings
    ) STORED,
    taxable_salary      NUMERIC(15,2) NOT NULL DEFAULT 0,   -- gross minus non-taxable allowances
    income_tax          NUMERIC(15,2) NOT NULL DEFAULT 0,
    pension_employee    NUMERIC(15,2) NOT NULL DEFAULT 0,   -- typically 7% of basic
    pension_employer    NUMERIC(15,2) NOT NULL DEFAULT 0,   -- 11% or 18% of basic
    total_deductions    NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_pay             NUMERIC(15,2) NOT NULL DEFAULT 0,
    status              finance.payroll_status NOT NULL DEFAULT 'Draft',
    payment_date        DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID,
    updated_by          UUID
);

-- 9. Tax Rates (optional configuration)
CREATE TABLE finance.tax_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_type        VARCHAR(50) NOT NULL,   -- VAT, Withholding, Income Tax
    rate            NUMERIC(5,2) NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_gl_accounts_parent      ON finance.gl_accounts(parent_id);
CREATE INDEX idx_gl_accounts_type        ON finance.gl_accounts(account_type);

CREATE INDEX idx_purchases_date          ON finance.purchases(purchase_date);
CREATE INDEX idx_purchases_seller        ON finance.purchases(seller_id);
CREATE INDEX idx_purchases_status        ON finance.purchases(status);

CREATE INDEX idx_purchase_items_purchase ON finance.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_item     ON finance.purchase_items(item_id);

CREATE INDEX idx_sales_date              ON finance.sales(sales_date);
CREATE INDEX idx_sales_customer          ON finance.sales(customer_id);
CREATE INDEX idx_sales_status            ON finance.sales(status);

CREATE INDEX idx_sales_items_sales       ON finance.sales_items(sales_id);
CREATE INDEX idx_sales_items_item        ON finance.sales_items(item_id);

CREATE INDEX idx_journals_date           ON finance.journals(journal_date);
CREATE INDEX idx_journals_status         ON finance.journals(status);

CREATE INDEX idx_journal_lines_journal   ON finance.journal_lines(journal_id);
CREATE INDEX idx_journal_lines_account   ON finance.journal_lines(gl_account_id);

CREATE INDEX idx_payroll_employee        ON finance.payroll(employee_id);
CREATE INDEX idx_payroll_period          ON finance.payroll(period_start, period_end);
CREATE INDEX idx_payroll_status          ON finance.payroll(status);

-- ============================================================
-- TRIGGERS (auto-update updated_at)
-- ============================================================
CREATE TRIGGER update_gl_accounts_updated_at
    BEFORE UPDATE ON finance.gl_accounts
    FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON finance.purchases
    FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON finance.sales
    FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at_column();

CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON finance.journals
    FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at
    BEFORE UPDATE ON finance.payroll
    FOR EACH ROW EXECUTE FUNCTION finance.update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) – permissive for standalone use
-- ============================================================
ALTER TABLE finance.gl_accounts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.purchases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.purchase_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.sales                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.sales_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.journals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.journal_lines            ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.payroll                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.tax_rates                ENABLE ROW LEVEL SECURITY;

-- Allow full access to all authenticated users.
-- If you do not use Supabase Auth, simply disable RLS on these tables
-- or replace `auth.role()` with `true` in the policy definition.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'supabase_auth') THEN
        -- Supabase Auth is present – use role-based policy
        EXECUTE 'CREATE POLICY finance_all_access ON finance.gl_accounts FOR ALL USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY finance_all_access ON finance.purchases FOR ALL USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY finance_all_access ON finance.purchase_items FOR ALL USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY finance_all_access ON finance.sales FOR ALL USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY finance_all_access ON finance.sales_items FOR ALL USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY finance_all_access ON finance.journals FOR ALL USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY finance_all_access ON finance.journal_lines FOR ALL USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY finance_all_access ON finance.payroll FOR ALL USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY finance_all_access ON finance.tax_rates FOR ALL USING (auth.role() = ''authenticated'')';
    ELSE
        -- No auth extension – grant unrestricted access (default)
        ALTER TABLE finance.gl_accounts DISABLE ROW LEVEL SECURITY;
        ALTER TABLE finance.purchases DISABLE ROW LEVEL SECURITY;
        ALTER TABLE finance.purchase_items DISABLE ROW LEVEL SECURITY;
        ALTER TABLE finance.sales DISABLE ROW LEVEL SECURITY;
        ALTER TABLE finance.sales_items DISABLE ROW LEVEL SECURITY;
        ALTER TABLE finance.journals DISABLE ROW LEVEL SECURITY;
        ALTER TABLE finance.journal_lines DISABLE ROW LEVEL SECURITY;
        ALTER TABLE finance.payroll DISABLE ROW LEVEL SECURITY;
        ALTER TABLE finance.tax_rates DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================
-- GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA finance TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA finance TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA finance TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA finance TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA finance
    GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA finance
    GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA finance
    GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;