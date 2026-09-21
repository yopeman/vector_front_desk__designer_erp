ALTER TABLE crt_design_bom
  ADD COLUMN IF NOT EXISTS text_message text,
  ADD COLUMN IF NOT EXISTS voice_note text,
  ADD COLUMN IF NOT EXISTS voice_note_url text,
  ADD COLUMN IF NOT EXISTS attached_file text,
  ADD COLUMN IF NOT EXISTS attached_file_url text,
  ADD COLUMN IF NOT EXISTS model_3d_file text,
  ADD COLUMN IF NOT EXISTS model_3d_url text,
  ADD COLUMN IF NOT EXISTS finishing_file text,
  ADD COLUMN IF NOT EXISTS finishing_url text;