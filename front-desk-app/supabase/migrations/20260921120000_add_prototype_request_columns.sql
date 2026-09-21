ALTER TABLE crt_prototype_requests
  ADD COLUMN IF NOT EXISTS start_time text,
  ADD COLUMN IF NOT EXISTS end_time text,
  ADD COLUMN IF NOT EXISTS text_message text,
  ADD COLUMN IF NOT EXISTS voice_note text,
  ADD COLUMN IF NOT EXISTS voice_note_url text,
  ADD COLUMN IF NOT EXISTS attached_file text,
  ADD COLUMN IF NOT EXISTS attached_file_url text;