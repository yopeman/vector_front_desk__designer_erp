-- Switch embedding column from nomic-embed-text-v1_5 (768 dims) to
-- all-minilm:22m via Ollama (384 dims).
alter table public.ai_attachment_chunks
    alter column embedding type vector(384) using embedding::vector(384);

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