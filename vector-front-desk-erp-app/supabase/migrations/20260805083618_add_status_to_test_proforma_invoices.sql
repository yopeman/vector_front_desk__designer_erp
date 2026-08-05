-- Add status column to test_proforma_invoices table
ALTER TABLE test_proforma_invoices 
ADD COLUMN status TEXT DEFAULT 'not_upgraded' 
CHECK (status IN ('not_upgraded', 'upgraded'));

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_test_proforma_invoices_status ON test_proforma_invoices(status);
