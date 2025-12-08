create table public.ai_recommendations (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  recommendation_type text null default 'general'::text,
  content text not null,
  priority integer null default 0,
  is_read boolean null default false,
  generated_at timestamp with time zone not null,
  expires_at timestamp with time zone null,
  source_attempt_id uuid null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint ai_recommendations_pkey primary key (id),
  constraint ai_recommendations_source_attempt_id_fkey foreign KEY (source_attempt_id) references test_attempts (id) on delete CASCADE,
  constraint ai_recommendations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint ai_recommendations_recommendation_type_check check (
    (
      recommendation_type = any (
        array[
          'general'::text,
          'post_test'::text,
          'study_plan'::text,
          'topic_review'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ai_recs_user on public.ai_recommendations using btree (user_id, generated_at desc) TABLESPACE pg_default;

create index IF not exists idx_ai_recs_unread on public.ai_recommendations using btree (user_id, is_read, priority desc) TABLESPACE pg_default;

create index IF not exists idx_ai_recs_type on public.ai_recommendations using btree (recommendation_type) TABLESPACE pg_default;
create table public.document_chunks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  document_id uuid not null,
  chunk_index integer not null,
  content text not null,
  content_length integer null,
  source_path text not null,
  embedding_status text null default 'pending'::text,
  visibility text null default 'private'::text,
  embedding extensions.vector null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint document_chunks_pkey primary key (id),
  constraint document_chunks_unique unique (document_id, chunk_index),
  constraint document_chunks_document_id_fkey foreign KEY (document_id) references user_documents (id) on delete CASCADE,
  constraint document_chunks_embedding_status_check check (
    (
      embedding_status = any (
        array[
          'pending'::text,
          'processing'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint document_chunks_visibility_check check (
    (
      visibility = any (array['private'::text, 'shared'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_document_chunks_document on public.document_chunks using btree (document_id, chunk_index) TABLESPACE pg_default;

create index IF not exists idx_document_chunks_status on public.document_chunks using btree (embedding_status) TABLESPACE pg_default;

create index IF not exists idx_document_chunks_user on public.document_chunks using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_document_chunks_embedding on public.document_chunks using ivfflat (embedding extensions.vector_cosine_ops)
with
  (lists = '100') TABLESPACE pg_default;
  create table public.mindmap_edges (
  id text not null,
  mindmap_id uuid not null,
  source_node_id text not null,
  target_node_id text not null,
  edge_type text null default 'prerequisite'::text,
  animated boolean null default false,
  style jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint mindmap_edges_pkey primary key (id),
  constraint mindmap_edges_mindmap_id_fkey foreign KEY (mindmap_id) references mindmaps (id) on delete CASCADE,
  constraint mindmap_edges_source_node_id_fkey foreign KEY (source_node_id) references mindmap_nodes (id) on delete CASCADE,
  constraint mindmap_edges_target_node_id_fkey foreign KEY (target_node_id) references mindmap_nodes (id) on delete CASCADE,
  constraint mindmap_edges_edge_type_check check (
    (
      edge_type = any (
        array[
          'prerequisite'::text,
          'related'::text,
          'sequence'::text
        ]
      )
    )
  ),
  constraint no_self_reference check ((source_node_id <> target_node_id))
) TABLESPACE pg_default;

create index IF not exists idx_mindmap_edges_source on public.mindmap_edges using btree (source_node_id) TABLESPACE pg_default;

create index IF not exists idx_mindmap_edges_target on public.mindmap_edges using btree (target_node_id) TABLESPACE pg_default;

create index IF not exists idx_mindmap_edges_mindmap on public.mindmap_edges using btree (mindmap_id) TABLESPACE pg_default;
create table public.mindmap_nodes (
  id text not null,
  mindmap_id uuid not null,
  user_id uuid not null,
  type text null default 'default'::text,
  label text not null,
  description text null,
  position_x numeric null default 0,
  position_y numeric null default 0,
  mastery_level integer null default 0,
  status text null default 'locked'::text,
  topic_id text null,
  prerequisites text[] null,
  data jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint mindmap_nodes_pkey primary key (id),
  constraint mindmap_nodes_mindmap_id_fkey foreign KEY (mindmap_id) references mindmaps (id) on delete CASCADE,
  constraint mindmap_nodes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint mindmap_nodes_mastery_level_check check (
    (
      (mastery_level >= 0)
      and (mastery_level <= 100)
    )
  ),
  constraint mindmap_nodes_status_check check (
    (
      status = any (
        array[
          'locked'::text,
          'unlocked'::text,
          'in_progress'::text,
          'completed'::text
        ]
      )
    )
  ),
  constraint mindmap_nodes_type_check check (
    (
      type = any (
        array[
          'default'::text,
          'quiz'::text,
          'lesson'::text,
          'practice'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_mindmap_nodes_mastery on public.mindmap_nodes using btree (mindmap_id, mastery_level desc) TABLESPACE pg_default;

create index IF not exists idx_mindmap_nodes_status on public.mindmap_nodes using btree (mindmap_id, status) TABLESPACE pg_default;

create index IF not exists idx_mindmap_nodes_topic on public.mindmap_nodes using btree (topic_id) TABLESPACE pg_default;

create index IF not exists idx_mindmap_nodes_user on public.mindmap_nodes using btree (user_id, updated_at desc) TABLESPACE pg_default;

create trigger trigger_update_mindmap_stats
after INSERT
or
update on mindmap_nodes for EACH row
execute FUNCTION update_mindmap_stats ();

create trigger update_mindmap_nodes_updated_at BEFORE
update on mindmap_nodes for EACH row
execute FUNCTION update_updated_at_column ();
create table public.mindmaps (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null default 'My Math Journey'::text,
  description text null,
  is_default boolean null default false,
  visibility text null default 'private'::text,
  total_nodes integer null default 0,
  completed_nodes integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint mindmaps_pkey primary key (id),
  constraint mindmaps_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint mindmaps_visibility_check check (
    (
      visibility = any (
        array['private'::text, 'shared'::text, 'public'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_mindmaps_user_visibility on public.mindmaps using btree (user_id, visibility) TABLESPACE pg_default;

create index IF not exists idx_mindmaps_updated on public.mindmaps using btree (updated_at desc) TABLESPACE pg_default;

create trigger update_mindmaps_updated_at BEFORE
update on mindmaps for EACH row
execute FUNCTION update_updated_at_column ();
create table public.node_progress (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  node_id text not null,
  mindmap_id uuid not null,
  opened boolean null default false,
  score integer null default 0,
  attempts integer null default 0,
  time_spent_seconds integer null default 0,
  last_updated timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  constraint node_progress_pkey primary key (id),
  constraint node_progress_user_node_unique unique (user_id, node_id),
  constraint node_progress_mindmap_id_fkey foreign KEY (mindmap_id) references mindmaps (id) on delete CASCADE,
  constraint node_progress_node_id_fkey foreign KEY (node_id) references mindmap_nodes (id) on delete CASCADE,
  constraint node_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint node_progress_score_check check (
    (
      (score >= 0)
      and (score <= 100)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_node_progress_user on public.node_progress using btree (user_id, last_updated desc) TABLESPACE pg_default;

create index IF not exists idx_node_progress_node on public.node_progress using btree (node_id) TABLESPACE pg_default;

create index IF not exists idx_node_progress_mindmap on public.node_progress using btree (mindmap_id) TABLESPACE pg_default;

create index IF not exists idx_node_progress_score on public.node_progress using btree (user_id, score desc) TABLESPACE pg_default;
create table public.student_profiles (
  id uuid not null,
  full_name text not null,
  grade_level text not null default '12'::text,
  avatar_url text null,
  strengths jsonb null default '[]'::jsonb,
  weakness jsonb null default '[]'::jsonb,
  learning_stats jsonb null default '{}'::jsonb,
  total_study_time integer null default 0,
  last_active_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint student_profiles_pkey primary key (id),
  constraint student_profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint grade_level_check check (
    (
      grade_level = any (array['10'::text, '11'::text, '12'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_student_profiles_last_active on public.student_profiles using btree (last_active_at desc) TABLESPACE pg_default;

create index IF not exists idx_student_profiles_grade on public.student_profiles using btree (grade_level) TABLESPACE pg_default;

create trigger update_student_profiles_updated_at BEFORE
update on student_profiles for EACH row
execute FUNCTION update_updated_at_column ();
create table public.test_attempt_answers (
  id uuid not null default gen_random_uuid (),
  attempt_id uuid not null,
  question_id text not null,
  question_type text not null,
  topic text null,
  difficulty text null,
  user_answer text null,
  correct_answer text not null,
  is_correct boolean null,
  score_earned double precision null default 0,
  time_spent_seconds integer null,
  related_node_id text null,
  related_mindmap_id uuid null,
  mistake_type text null,
  created_at timestamp with time zone null default now(),
  constraint test_attempt_answers_pkey primary key (id),
  constraint test_attempt_answers_attempt_id_fkey foreign KEY (attempt_id) references test_attempts (id) on delete CASCADE,
  constraint test_attempt_answers_node_fkey foreign KEY (related_node_id) references mindmap_nodes (id) on delete set null,
  constraint test_attempt_answers_question_type_check check (
    (
      question_type = any (
        array[
          'multiple-choice'::text,
          'true-false'::text,
          'short-answer'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_attempt_answers_attempt on public.test_attempt_answers using btree (attempt_id) TABLESPACE pg_default;

create index IF not exists idx_attempt_answers_node_link on public.test_attempt_answers using btree (related_mindmap_id, related_node_id) TABLESPACE pg_default;

create index IF not exists idx_answers_topic_correct on public.test_attempt_answers using btree (topic, is_correct) TABLESPACE pg_default;

create index IF not exists idx_answers_user_topic on public.test_attempt_answers using btree (attempt_id, topic) TABLESPACE pg_default;

create trigger trigger_update_mastery
after INSERT on test_attempt_answers for EACH row
execute FUNCTION update_mindmap_mastery ();
create table public.test_attempts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  test_id text null,
  test_title text not null,
  topic text null,
  difficulty text null,
  test_type text null default 'standard'::text,
  answers jsonb null,
  score double precision null,
  correct_answers integer null default 0,
  total_questions integer not null,
  time_spent integer null default 0,
  multiple_choice_score double precision null,
  true_false_score double precision null,
  short_answer_score double precision null,
  started_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  submitted_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint test_attempts_pkey primary key (id),
  constraint test_attempts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint test_attempts_difficulty_check check (
    (
      difficulty = any (array['easy'::text, 'medium'::text, 'hard'::text])
    )
  ),
  constraint test_attempts_score_check check (
    (
      (score >= (0)::double precision)
      and (score <= (100)::double precision)
    )
  ),
  constraint test_attempts_test_type_check check (
    (
      test_type = any (
        array[
          'standard'::text,
          'adaptive'::text,
          'practice'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_test_attempts_user on public.test_attempts using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_test_attempts_score on public.test_attempts using btree (user_id, score desc) TABLESPACE pg_default;

create index IF not exists idx_test_attempts_topic on public.test_attempts using btree (topic) TABLESPACE pg_default;

create index IF not exists idx_test_attempts_completed on public.test_attempts using btree (user_id, completed_at desc nulls last) TABLESPACE pg_default;
create table public.test_material_chunks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  material_id uuid not null,
  chunk_index integer not null,
  content text not null,
  content_length integer null,
  source_path text not null,
  embedding_status text null default 'pending'::text,
  visibility text null default 'private'::text,
  embedding extensions.vector null,
  created_at timestamp with time zone not null default now(),
  constraint test_material_chunks_pkey primary key (id),
  constraint test_material_chunks_unique unique (material_id, chunk_index),
  constraint test_material_chunks_material_id_fkey foreign KEY (material_id) references test_materials (id) on delete CASCADE,
  constraint test_material_chunks_embedding_status_check check (
    (
      embedding_status = any (
        array[
          'pending'::text,
          'processing'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint test_material_chunks_visibility_check check (
    (
      visibility = any (array['private'::text, 'shared'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_test_material_chunks_material on public.test_material_chunks using btree (material_id, chunk_index) TABLESPACE pg_default;

create index IF not exists idx_test_material_chunks_status on public.test_material_chunks using btree (embedding_status) TABLESPACE pg_default;

create index IF not exists idx_test_material_chunks_embedding on public.test_material_chunks using ivfflat (embedding extensions.vector_cosine_ops)
with
  (lists = '100') TABLESPACE pg_default;
create table public.test_materials (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  file_name text not null,
  file_size bigint null,
  mime_type text null,
  source_path text not null,
  rag_status text null default 'uploaded'::text,
  chunk_count integer null default 0,
  visibility text null default 'private'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint test_materials_pkey primary key (id),
  constraint test_materials_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint test_materials_rag_status_check check (
    (
      rag_status = any (
        array[
          'uploaded'::text,
          'processing'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint test_materials_visibility_check check (
    (
      visibility = any (array['private'::text, 'shared'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_test_materials_user on public.test_materials using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_test_materials_status on public.test_materials using btree (rag_status) TABLESPACE pg_default;

create trigger update_test_materials_updated_at BEFORE
update on test_materials for EACH row
execute FUNCTION update_updated_at_column ();
create view public.topic_weakness_analysis as
select
  taa.topic,
  ta.user_id,
  count(*) as total_questions,
  sum(
    case
      when taa.is_correct then 1
      else 0
    end
  ) as correct_answers,
  round(
    100.0 * sum(
      case
        when taa.is_correct then 1
        else 0
      end
    )::numeric / count(*)::numeric,
    2
  ) as accuracy
from
  test_attempt_answers taa
  join test_attempts ta on ta.id = taa.attempt_id
where
  taa.topic is not null
group by
  taa.topic,
  ta.user_id
having
  count(*) >= 3
order by
  (
    round(
      100.0 * sum(
        case
          when taa.is_correct then 1
          else 0
        end
      )::numeric / count(*)::numeric,
      2
    )
  );
create table public.user_activity_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  activity_type text not null,
  entity_type text null,
  entity_id uuid null,
  metadata jsonb null default '{}'::jsonb,
  ip_address inet null,
  user_agent text null,
  created_at timestamp with time zone null default now(),
  constraint user_activity_logs_pkey primary key (id),
  constraint user_activity_logs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_activity_logs_activity_type_check check (
    (
      activity_type = any (
        array[
          'login'::text,
          'test_start'::text,
          'test_complete'::text,
          'document_upload'::text,
          'node_unlock'::text,
          'chat_message'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_activity_logs_user on public.user_activity_logs using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_activity_logs_type on public.user_activity_logs using btree (activity_type, created_at desc) TABLESPACE pg_default;
create table public.user_documents (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  file_name text not null,
  file_size bigint null,
  mime_type text null,
  source_path text not null,
  rag_status text null default 'uploaded'::text,
  chunk_count integer null default 0,
  visibility text null default 'private'::text,
  linked_node_id text null,
  linked_mindmap_id uuid null,
  upload_metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_documents_pkey primary key (id),
  constraint user_documents_linked_mindmap_id_fkey foreign KEY (linked_mindmap_id) references mindmaps (id) on delete set null,
  constraint user_documents_linked_node_id_fkey foreign KEY (linked_node_id) references mindmap_nodes (id) on delete set null,
  constraint user_documents_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_documents_rag_status_check check (
    (
      rag_status = any (
        array[
          'uploaded'::text,
          'processing'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint user_documents_visibility_check check (
    (
      visibility = any (array['private'::text, 'shared'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_documents_user on public.user_documents using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_user_documents_status on public.user_documents using btree (rag_status) TABLESPACE pg_default;

create index IF not exists idx_user_documents_linked on public.user_documents using btree (linked_mindmap_id, linked_node_id) TABLESPACE pg_default;

create trigger update_user_documents_updated_at BEFORE
update on user_documents for EACH row
execute FUNCTION update_updated_at_column ();
create view public.user_performance_summary as
select
  u.id as user_id,
  sp.full_name,
  count(distinct ta.id) as total_tests,
  avg(ta.score) as avg_score,
  sum(ta.time_spent) as total_study_time,
  count(
    distinct case
      when ta.score >= 80::double precision then ta.id
      else null::uuid
    end
  ) as high_score_tests,
  max(ta.completed_at) as last_test_date
from
  auth.users u
  left join student_profiles sp on sp.id = u.id
  left join test_attempts ta on ta.user_id = u.id
group by
  u.id,
  sp.full_name;
  