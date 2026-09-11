-- LectureFlow MBBS — starter Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.lectures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  title text not null,
  lecture_date date not null default current_date,
  audio_file_url text,
  duration_minutes integer,
  status text not null default 'needs_revision' check (status in ('learned','needs_revision','weak')),
  created_at timestamptz not null default now()
);

create table if not exists public.lecture_transcripts (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  transcript text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lecture_notes (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  full_notes jsonb not null default '[]'::jsonb,
  revision_notes jsonb not null default '[]'::jsonb,
  professor_emphasis jsonb not null default '[]'::jsonb,
  must_know jsonb not null default '[]'::jsonb,
  confusing_areas jsonb not null default '[]'::jsonb,
  topics_to_read_more jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  kind text not null check (kind in ('recall','viva','mcq')),
  question text not null,
  answer text,
  options jsonb,
  explanation text,
  created_at timestamptz not null default now()
);

create table if not exists public.revision_items (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  due_at timestamptz not null,
  interval_label text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  knowledge_state text not null default 'needs_revision' check (knowledge_state in ('learned','needs_revision','weak')),
  last_reviewed_at timestamptz,
  unique(user_id, lecture_id)
);

alter table public.subjects enable row level security;
alter table public.lectures enable row level security;
alter table public.lecture_transcripts enable row level security;
alter table public.lecture_notes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.revision_items enable row level security;
alter table public.user_progress enable row level security;

create policy "users own subjects" on public.subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own lectures" on public.lectures for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read transcript through lecture" on public.lecture_transcripts for all using (exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid())) with check (exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid()));
create policy "users read notes through lecture" on public.lecture_notes for all using (exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid())) with check (exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid()));
create policy "users read quiz through lecture" on public.quiz_questions for all using (exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid())) with check (exists(select 1 from public.lectures l where l.id=lecture_id and l.user_id=auth.uid()));
create policy "users own revisions" on public.revision_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own progress" on public.user_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
