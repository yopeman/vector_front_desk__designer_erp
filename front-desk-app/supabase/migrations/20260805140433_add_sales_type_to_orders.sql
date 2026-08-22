-- Add sales_type column to orders table
ALTER TABLE orders ADD COLUMN sales_type TEXT DEFAULT 'direct_sales' CHECK (sales_type IN ('from_design', 'direct_sales'));
