ALTER TABLE crt_idea_hub
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS attached_file text,
  ADD COLUMN IF NOT EXISTS attached_file_url text;