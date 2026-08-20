-- ============================================================
-- Add description field to files table
-- Migration: 20260727_00003_add_files_description
-- Description: Adds description field to files table for document metadata
-- ============================================================

ALTER TABLE files ADD COLUMN IF NOT EXISTS description TEXT;
