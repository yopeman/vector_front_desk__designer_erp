-- Add marketing, strategy, date, and status columns to products_services table
ALTER TABLE products_services
ADD COLUMN marketing TEXT,
ADD COLUMN strategy TEXT,
ADD COLUMN date DATE,
ADD COLUMN status TEXT;
