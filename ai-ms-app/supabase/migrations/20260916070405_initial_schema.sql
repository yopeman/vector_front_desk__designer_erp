-- Sessions
create table sessions (
  id bigserial primary key,
  user_id uuid not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chats (one Q&A turn)
create table chats (
  id bigserial primary key,
  session_id bigint not null references sessions(id) on delete cascade,
  question text,
  answer text,
  question_audio_url text,
  answer_audio_url text,
  plans jsonb,               -- assistant plan/steps, if applicable
  created_at timestamptz not null default now()
);

-- Attachments
create table attachments (
  id bigserial primary key,
  session_id bigint not null references sessions(id) on delete cascade,
  chat_id bigint references chats(id) on delete set null,  -- nullable
  file_name text not null,
  file_size bigint,
  file_summary text,
  storage_path text,         -- Supabase Storage path
  uploaded_at timestamptz not null default now()
);

-- RAG chunks
create table document_chunks (
  id bigserial primary key,
  attachment_id bigint not null references attachments(id) on delete cascade,
  session_id bigint not null references sessions(id) on delete cascade,
  content text not null,
  metadata jsonb default '{}',
  embedding vector(1536)
);

create index on document_chunks using ivfflat (embedding vector_cosine_ops);
create index on document_chunks (session_id);
