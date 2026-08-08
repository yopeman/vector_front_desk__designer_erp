-- ============================================================
-- Finance ERP Module Migration for Frontdesk Database (Public Schema)
-- This creates tables in public schema with finance_ prefix
-- ============================================================

-- Enable UUID generation if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DROP EXISTING TYPES (if they exist) - to avoid conflicts
-- ============================================================
DO $$ 
BEGIN
    DROP TYPE IF EXISTS finance_account_type CASCADE;
    DROP TYPE IF EXISTS finance_purchase_type CASCADE;
    DROP TYPE IF EXISTS finance_sales_type CASCADE;
    DROP TYPE IF EXISTS finance_vat_type CASCADE;
    DROP TYPE IF EXISTS finance_receipt_source CASCADE;
    DROP TYPE IF EXISTS finance_vat_withholding CASCADE;
    DROP TYPE IF EXISTS finance_journal_status CASCADE;
    DROP TYPE IF EXISTS finance_payroll_status CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping types: %', SQLERRM;
END $$;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE finance_account_type AS ENUM (
    'Asset',
    'Liability',
    'Equity',
    'Revenue',
    'Expense'
);

CREATE TYPE finance_purchase_type AS ENUM (
    'Cash',
    'Credit'
);

CREATE TYPE finance_sales_type AS ENUM (
    'Cash',
    'Credit'
);

CREATE TYPE finance_vat_type AS ENUM (
    'VAT',
    'Exempted'
);

CREATE TYPE finance_receipt_source AS ENUM (
    'Manual',
    'FS'
);

CREATE TYPE finance_vat_withholding AS ENUM (
    'No Withholding',
    '3%',
    '7.5%',
    '30%'
);

CREATE TYPE finance_journal_status AS ENUM (
    'Draft',
    'Posted'
);

CREATE TYPE finance_payroll_status AS ENUM (
    'Draft',
    'Approved',
    'Paid'
);

-- ============================================================
-- HELPER FUNCTION FOR updated_at TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION finance_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DROP EXISTING TABLES (if they exist)
-- ============================================================
DROP TABLE IF EXISTS finance_sync_log CASCADE;
DROP TABLE IF EXISTS finance_tax_rates CASCADE;
DROP TABLE IF EXISTS finance_payroll CASCADE;
DROP TABLE IF EXISTS finance_journal_lines CASCADE;
DROP TABLE IF EXISTS finance_journals CASCADE;
DROP TABLE IF EXISTS finance_sales_items CASCADE;
DROP TABLE IF EXISTS finance_sales CASCADE;
DROP TABLE IF EXISTS finance_purchase_items CASCADE;
DROP TABLE IF EXISTS finance_purchases CASCADE;
DROP TABLE IF EXISTS finance_gl_accounts CASCADE;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Chart of Accounts
CREATE TABLE finance_gl_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code    VARCHAR(20) NOT NULL UNIQUE,
    account_name    VARCHAR(255) NOT NULL,
    account_type    finance_account_type NOT NULL,
    parent_id       UUID REFERENCES finance_gl_accounts(id) ON DELETE SET NULL,
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID
);

-- 2. Purchases (header)
CREATE TABLE finance_purchases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_no     VARCHAR(50) NOT NULL UNIQUE,
    purchase_type   finance_purchase_type NOT NULL,
    seller_tin      VARCHAR(50),
    seller_name     VARCHAR(255) NOT NULL,
    seller_id       UUID,
    purchase_date   DATE NOT NULL,
    receipt_source  finance_receipt_source NOT NULL,
    reference_no    VARCHAR(100),
    gl_account_id   UUID NOT NULL REFERENCES finance_gl_accounts(id),
    vat_type        finance_vat_type NOT NULL,
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
CREATE TABLE finance_purchase_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id     UUID NOT NULL REFERENCES finance_purchases(id) ON DELETE CASCADE,
    item_id         UUID,
    item_name       VARCHAR(255) NOT NULL,
    description     TEXT,
    quantity        NUMERIC(15,2) NOT NULL CHECK (quantity >= 0),
    unit_price      NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
    total           NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    gl_account_id   UUID REFERENCES finance_gl_accounts(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Sales (header)
CREATE TABLE finance_sales (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_no            VARCHAR(50) NOT NULL UNIQUE,
    sales_type          finance_sales_type NOT NULL,
    sales_category      VARCHAR(50) NOT NULL,
    cash_received       NUMERIC(15,2) DEFAULT 0,
    customer_tin        VARCHAR(50),
    customer_name       VARCHAR(255) NOT NULL,
    customer_id         UUID,
    sales_date          DATE NOT NULL,
    receipt_source      finance_receipt_source NOT NULL,
    vat_withholding     finance_vat_withholding NOT NULL DEFAULT 'No Withholding',
    subtotal            NUMERIC(15,2) NOT NULL DEFAULT 0,
    vat_amount          NUMERIC(15,2) NOT NULL DEFAULT 0,
    withholding_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_amount          NUMERIC(15,2) NOT NULL DEFAULT 0,
    status              VARCHAR(50) DEFAULT 'Draft',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID,
    updated_by          UUID
);

-- 5. Sales Items (line items)
CREATE TABLE finance_sales_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_id        UUID NOT NULL REFERENCES finance_sales(id) ON DELETE CASCADE,
    item_id         UUID,
    item_name       VARCHAR(255) NOT NULL,
    quantity        NUMERIC(15,2) NOT NULL CHECK (quantity >= 0),
    unit_price      NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
    tax_rate        NUMERIC(5,2) DEFAULT 15.00,
    total           NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    gl_account_id   UUID REFERENCES finance_gl_accounts(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. General Journal (header)
CREATE TABLE finance_journals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_no      VARCHAR(50) NOT NULL UNIQUE,
    journal_date    DATE NOT NULL,
    reference       VARCHAR(100),
    description     TEXT,
    status          finance_journal_status NOT NULL DEFAULT 'Draft',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID
);

-- 7. Journal Lines (double-entry)
CREATE TABLE finance_journal_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id      UUID NOT NULL REFERENCES finance_journals(id) ON DELETE CASCADE,
    gl_account_id   UUID NOT NULL REFERENCES finance_gl_accounts(id),
    description     TEXT,
    debit           NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit          NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Payroll
CREATE TABLE finance_payroll (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID NOT NULL,
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
    taxable_salary      NUMERIC(15,2) NOT NULL DEFAULT 0,
    income_tax          NUMERIC(15,2) NOT NULL DEFAULT 0,
    pension_employee    NUMERIC(15,2) NOT NULL DEFAULT 0,
    pension_employer    NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_deductions    NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_pay             NUMERIC(15,2) NOT NULL DEFAULT 0,
    status              finance_payroll_status NOT NULL DEFAULT 'Draft',
    payment_date        DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID,
    updated_by          UUID
);

-- 9. Tax Rates
CREATE TABLE finance_tax_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_type        VARCHAR(50) NOT NULL,
    rate            NUMERIC(5,2) NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Finance Sync Log (for deduplication)
CREATE TABLE finance_sync_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type     VARCHAR(50) NOT NULL,
    source_id       UUID NOT NULL,
    sync_type       VARCHAR(50) NOT NULL,
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    period_start    DATE,
    period_end      DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'success',
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_finance_gl_accounts_parent      ON finance_gl_accounts(parent_id);
CREATE INDEX idx_finance_gl_accounts_type        ON finance_gl_accounts(account_type);

CREATE INDEX idx_finance_purchases_date          ON finance_purchases(purchase_date);
CREATE INDEX idx_finance_purchases_seller        ON finance_purchases(seller_id);
CREATE INDEX idx_finance_purchases_status        ON finance_purchases(status);

CREATE INDEX idx_finance_purchase_items_purchase ON finance_purchase_items(purchase_id);
CREATE INDEX idx_finance_purchase_items_item     ON finance_purchase_items(item_id);

CREATE INDEX idx_finance_sales_date              ON finance_sales(sales_date);
CREATE INDEX idx_finance_sales_customer          ON finance_sales(customer_id);
CREATE INDEX idx_finance_sales_status            ON finance_sales(status);

CREATE INDEX idx_finance_sales_items_sales       ON finance_sales_items(sales_id);
CREATE INDEX idx_finance_sales_items_item        ON finance_sales_items(item_id);

CREATE INDEX idx_finance_journals_date           ON finance_journals(journal_date);
CREATE INDEX idx_finance_journals_status         ON finance_journals(status);

CREATE INDEX idx_finance_journal_lines_journal   ON finance_journal_lines(journal_id);
CREATE INDEX idx_finance_journal_lines_account   ON finance_journal_lines(gl_account_id);

CREATE INDEX idx_finance_payroll_employee        ON finance_payroll(employee_id);
CREATE INDEX idx_finance_payroll_period          ON finance_payroll(period_start, period_end);
CREATE INDEX idx_finance_payroll_status          ON finance_payroll(status);

CREATE INDEX idx_finance_sync_log_source         ON finance_sync_log(source_type, source_id);
CREATE INDEX idx_finance_sync_log_type           ON finance_sync_log(sync_type);
CREATE INDEX idx_finance_sync_log_period         ON finance_sync_log(period_start, period_end);
CREATE INDEX idx_finance_sync_log_status         ON finance_sync_log(status);

-- Unique constraint to prevent duplicate successful syncs
CREATE UNIQUE INDEX idx_finance_sync_log_unique 
ON finance_sync_log(source_type, source_id, sync_type, period_start, period_end)
WHERE status = 'success';

-- ============================================================
-- TRIGGERS (auto-update updated_at)
-- ============================================================
CREATE TRIGGER update_finance_gl_accounts_updated_at
    BEFORE UPDATE ON finance_gl_accounts
    FOR EACH ROW EXECUTE FUNCTION finance_update_updated_at_column();

CREATE TRIGGER update_finance_purchases_updated_at
    BEFORE UPDATE ON finance_purchases
    FOR EACH ROW EXECUTE FUNCTION finance_update_updated_at_column();

CREATE TRIGGER update_finance_sales_updated_at
    BEFORE UPDATE ON finance_sales
    FOR EACH ROW EXECUTE FUNCTION finance_update_updated_at_column();

CREATE TRIGGER update_finance_journals_updated_at
    BEFORE UPDATE ON finance_journals
    FOR EACH ROW EXECUTE FUNCTION finance_update_updated_at_column();

CREATE TRIGGER update_finance_payroll_updated_at
    BEFORE UPDATE ON finance_payroll
    FOR EACH ROW EXECUTE FUNCTION finance_update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE finance_gl_accounts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_purchases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_purchase_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_sales                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_sales_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_journals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_journal_lines            ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_payroll                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_tax_rates                ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_sync_log                 ENABLE ROW LEVEL SECURITY;

-- Disable RLS for unrestricted access
ALTER TABLE finance_gl_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_sales_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_journal_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_payroll DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_tax_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_sync_log DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- GRANTS
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- ============================================================
-- SAMPLE DATA - Default GL Accounts
-- ============================================================
INSERT INTO finance_gl_accounts (account_code, account_name, account_type, description) VALUES
('1000', 'Cash', 'Asset', 'Cash and cash equivalents'),
('1100', 'Accounts Receivable', 'Asset', 'Money owed by customers'),
('1200', 'Inventory', 'Asset', 'Stock and inventory'),
('2000', 'Accounts Payable', 'Liability', 'Money owed to suppliers'),
('3000', 'Owner Equity', 'Equity', 'Owner investment'),
('4000', 'Sales Revenue', 'Revenue', 'Income from sales'),
('5000', 'Cost of Goods Sold', 'Expense', 'Direct costs of sales'),
('6000', 'Operating Expenses', 'Expense', 'General operating costs'),
('7000', 'Payroll Expenses', 'Expense', 'Employee salaries and benefits'),
('8000', 'Tax Expenses', 'Expense', 'Income tax and other taxes')
ON CONFLICT (account_code) DO NOTHING;
