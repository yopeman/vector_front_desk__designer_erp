-- Add attached_file_ids and note columns to deliveries and installations tables

-- Add columns to deliveries table
ALTER TABLE deliveries
    ADD COLUMN IF NOT EXISTS attached_file_ids UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS note TEXT;

-- Add columns to installations table
ALTER TABLE installations
    ADD COLUMN IF NOT EXISTS attached_file_ids UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS note TEXT;
