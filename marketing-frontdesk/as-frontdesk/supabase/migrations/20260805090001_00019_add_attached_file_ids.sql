-- Add attached_file_ids field to invoices, payments, and test_proforma_invoices tables
-- Migration: 20260805_00019_add_attached_file_ids
-- Description: Adds file attachment support to invoice-related tables

-- Add attached_file_ids to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS attached_file_ids UUID[] DEFAULT '{}';

-- Add attached_file_ids to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS attached_file_ids UUID[] DEFAULT '{}';

-- Add attached_file_ids to test_proforma_invoices table
ALTER TABLE test_proforma_invoices 
ADD COLUMN IF NOT EXISTS attached_file_ids UUID[] DEFAULT '{}';
