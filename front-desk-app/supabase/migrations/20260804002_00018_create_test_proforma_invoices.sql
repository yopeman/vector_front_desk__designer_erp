-- Create test_proforma_invoices table
CREATE TABLE IF NOT EXISTS test_proforma_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no      TEXT NOT NULL UNIQUE,
    order_no        TEXT,
    client_name     TEXT NOT NULL,
    subtotal        NUMERIC DEFAULT 0,
    vat_amount      NUMERIC DEFAULT 0,
    vat_percentage  NUMERIC DEFAULT 15,
    grand_total     NUMERIC DEFAULT 0,
    apply_vat       BOOLEAN DEFAULT true,
    items           JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for invoice_no
CREATE INDEX IF NOT EXISTS idx_test_proforma_invoices_invoice_no ON test_proforma_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_test_proforma_invoices_client_name ON test_proforma_invoices(client_name);
