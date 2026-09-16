-- AI Assistant schema for Vector ERP (Supabase / Postgres)
-- Run this in the Supabase SQL editor (Database -> SQL Editor).

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- ai_sessions : one chat session per user
-- ---------------------------------------------------------------------------
create table if not exists public.ai_sessions (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null,
    title       text not null default 'New chat',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

comment on column public.ai_sessions.user_id is 'References the ERP users.id (or auth.users.id)';

-- ---------------------------------------------------------------------------
-- ai_chats : individual messages within a session (role: user / assistant)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_chats (
    id          uuid primary key default gen_random_uuid(),
    session_id  uuid not null references public.ai_sessions(id) on delete cascade,
    role        text not null check (role in ('user', 'assistant')),
    content     text not null,
    created_at  timestamptz not null default now()
);

create index if not exists idx_ai_chats_session on public.ai_chats (session_id, created_at);

-- ---------------------------------------------------------------------------
-- ai_attachments : uploaded files in a session (metadata only)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_attachments (
    id          uuid primary key default gen_random_uuid(),
    session_id  uuid not null references public.ai_sessions(id) on delete cascade,
    name        text not null,
    mime_type   text,
    file_size   bigint,
    created_at  timestamptz not null default now()
);

create index if not exists idx_ai_attachments_session on public.ai_attachments (session_id, created_at);

-- ---------------------------------------------------------------------------
-- ai_attachment_chunks : text chunks + embeddings (embedding model: all-minilm:22m, 384 dims)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_attachment_chunks (
    id          uuid primary key default gen_random_uuid(),
    attachment_id uuid not null references public.ai_attachments(id) on delete cascade,
    chunk_index int not null,
    content     text not null,
    embedding   vector(384) not null,
    created_at  timestamptz not null default now()
);

create index if not exists idx_ai_attachment_chunks_attachment on public.ai_attachment_chunks (attachment_id, chunk_index);

-- ---------------------------------------------------------------------------
-- RPC: nearest-neighbour search over chunks of a session (cosine distance)
-- ---------------------------------------------------------------------------
create or replace function public.match_ai_attachments(
    session_uuid uuid,
    query_embedding vector(384),
    match_count int default 5
)
returns table (
    chunk_id    uuid,
    attachment_id uuid,
    file_name   text,
    content     text,
    similarity  double precision
)
language plpgsql
as $$
begin
    return query
    select
        c.id,
        c.attachment_id,
        a.name,
        c.content,
        1 - (c.embedding <=> query_embedding) as similarity
    from
        public.ai_attachment_chunks c
    join
        public.ai_attachments a on a.id = c.attachment_id
    where
        a.session_id = session_uuid
    order by (c.embedding <=> query_embedding)
    limit match_count;
end;
$$;
