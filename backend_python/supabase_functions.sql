-- Function to match documents for Chat
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
) returns table (
  id uuid,
  content text,
  similarity float,
  file_name text,
  source_path text
) language plpgsql stable as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity,
    user_documents.file_name,
    document_chunks.source_path
  from document_chunks
  join user_documents on document_chunks.document_id = user_documents.id
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  and document_chunks.user_id = p_user_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Function to match test materials for Test Generation
create or replace function match_test_materials (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
) returns table (
  id uuid,
  content text,
  similarity float,
  file_name text,
  source_path text
) language plpgsql stable as $$
begin
  return query
  select
    test_material_chunks.id,
    test_material_chunks.content,
    1 - (test_material_chunks.embedding <=> query_embedding) as similarity,
    test_materials.file_name,
    test_material_chunks.source_path
  from test_material_chunks
  join test_materials on test_material_chunks.material_id = test_materials.id
  where 1 - (test_material_chunks.embedding <=> query_embedding) > match_threshold
  and test_material_chunks.user_id = p_user_id
  order by test_material_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- [NEW] Table for Node Progress
create table if not exists node_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  node_id text not null,
  score float,
  status text default 'learning', -- 'learning', 'mastered'
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, node_id)
);

-- Enable RLS
alter table node_progress enable row level security;

-- Policy
create policy "Users can view their own progress"
on node_progress for select
using (auth.uid() = user_id);

create policy "Users can insert/update their own progress"
on node_progress for insert
with check (auth.uid() = user_id);

create policy "Users can update their own progress"
on node_progress for update
using (auth.uid() = user_id);
