-- Add items column to finance_gl_accounts table
ALTER TABLE finance_gl_accounts 
ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
