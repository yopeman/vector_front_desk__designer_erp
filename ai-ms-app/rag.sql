create or replace function match_session_chunks (
  query_embedding vector(1536),
  session_id_filter bigint,
  match_count int default 5
)
returns table (
  id bigint,
  attachment_id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.attachment_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.session_id = session_id_filter
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
