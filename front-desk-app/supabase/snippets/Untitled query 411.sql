
-- ---------------------------------------------------------------------------
-- ai_attachment_chunks : text chunks + embeddings (embedding model: text-embedding-004, 768 dims)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_attachment_chunks (
    id          uuid primary key default gen_random_uuid(),
    attachment_id uuid not null references public.ai_attachments(id) on delete cascade,
    chunk_index int not null,
    content     text not null,
    embedding   vector(768) not null,
    created_at  timestamptz not null default now()
);

create index if not exists idx_ai_attachment_chunks_attachment on public.ai_attachment_chunks (attachment_id, chunk_index);

-- ---------------------------------------------------------------------------
-- RPC: nearest-neighbour search over chunks of a session (cosine distance)
-- ---------------------------------------------------------------------------
create or replace function public.match_ai_attachments(
    session_uuid uuid,
    query_embedding vector(768),
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
