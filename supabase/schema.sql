-- ============================================================
-- JEE DISCIPLINE SYSTEM — SUPABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extended profile)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  target_exam text default 'JEE Advanced',
  created_at timestamptz default now(),
  streak integer default 0,
  last_active_date date,
  discipline_score integer default 0
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- TODOS
-- ============================================================
create table public.todos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  subject text check (subject in ('Physics','Chemistry','Mathematics','General')),
  priority text check (priority in ('urgent','high','medium','low')) default 'medium',
  status text check (status in ('pending','in_progress','completed','overdue')) default 'pending',
  due_date date,
  due_time time,
  completed_at timestamptz,
  created_at timestamptz default now(),
  tags text[]
);
alter table public.todos enable row level security;
create policy "Users own todos" on public.todos for all using (auth.uid() = user_id);

-- ============================================================
-- STUDY SESSIONS
-- ============================================================
create table public.study_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  subject text check (subject in ('Physics','Chemistry','Mathematics')),
  hours numeric(4,2) not null,
  session_date date not null default current_date,
  session_type text check (session_type in ('concept','practice','revision','mock_analysis')),
  notes text,
  focus_score integer check (focus_score between 1 and 10),
  created_at timestamptz default now()
);
alter table public.study_sessions enable row level security;
create policy "Users own sessions" on public.study_sessions for all using (auth.uid() = user_id);

-- ============================================================
-- SYLLABUS — SUBJECTS
-- ============================================================
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  color text default '#3B82F6',
  created_at timestamptz default now()
);
alter table public.subjects enable row level security;
create policy "Users own subjects" on public.subjects for all using (auth.uid() = user_id);

-- CHAPTERS
create table public.chapters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  name text not null,
  weightage integer default 5,
  status text check (status in ('not_started','in_progress','revised','mastered')) default 'not_started',
  completion_percent integer default 0,
  last_revised date,
  revision_due date,
  is_weak boolean default false,
  created_at timestamptz default now()
);
alter table public.chapters enable row level security;
create policy "Users own chapters" on public.chapters for all using (auth.uid() = user_id);

-- SUBTOPICS
create table public.subtopics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  name text not null,
  status text check (status in ('not_started','in_progress','revised','mastered')) default 'not_started',
  notes text,
  created_at timestamptz default now()
);
alter table public.subtopics enable row level security;
create policy "Users own subtopics" on public.subtopics for all using (auth.uid() = user_id);

-- ============================================================
-- EXAMS / COUNTDOWN
-- ============================================================
create table public.exams (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  exam_date date not null,
  exam_type text check (exam_type in ('JEE_Main','JEE_Advanced','BITSAT','Other')),
  priority text check (priority in ('critical','high','medium','low')) default 'high',
  notes text,
  created_at timestamptz default now()
);
alter table public.exams enable row level security;
create policy "Users own exams" on public.exams for all using (auth.uid() = user_id);

-- ============================================================
-- MARKS / MOCK TESTS
-- ============================================================
create table public.marks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  test_name text not null,
  test_date date not null default current_date,
  test_type text check (test_type in ('Full Mock','Part Mock','Chapter Test','Minor Test')),
  physics_marks numeric(6,2),
  chemistry_marks numeric(6,2),
  mathematics_marks numeric(6,2),
  physics_total numeric(6,2),
  chemistry_total numeric(6,2),
  mathematics_total numeric(6,2),
  total_marks numeric(6,2),
  total_out_of numeric(6,2),
  rank integer,
  time_taken integer,
  accuracy numeric(5,2),
  mistakes text,
  analysis_done boolean default false,
  improvement_notes text,
  created_at timestamptz default now()
);
alter table public.marks enable row level security;
create policy "Users own marks" on public.marks for all using (auth.uid() = user_id);

-- ============================================================
-- MISTAKE JOURNAL
-- ============================================================
create table public.mistakes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  subject text,
  topic text,
  mistake_type text check (mistake_type in ('concept','calculation','silly','time_management')),
  description text not null,
  mark_id uuid references public.marks(id),
  resolved boolean default false,
  created_at timestamptz default now()
);
alter table public.mistakes enable row level security;
create policy "Users own mistakes" on public.mistakes for all using (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE OVERDUE TODOS (Postgres function)
-- ============================================================
create or replace function update_overdue_todos()
returns void as $$
  update public.todos
  set status = 'overdue'
  where status = 'pending'
    and due_date < current_date;
$$ language sql security definer;
