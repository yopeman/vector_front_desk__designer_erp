-- ============================================================
-- Create documents storage bucket
-- Migration: 20260727_00004_create_documents_bucket
-- Description: Creates a storage bucket for client documents
-- ============================================================
 
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
