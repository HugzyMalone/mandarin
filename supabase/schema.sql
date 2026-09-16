create table if not exists public.scores (
  id bigint generated always as identity primary key,
  lesson text not null check (char_length(lesson) between 1 and 60),
  name text not null check (char_length(name) between 1 and 12),
  score int not null check (score >= 0),
  correct int not null check (correct >= 0),
  total int not null check (total between 1 and 200 and correct <= total and score <= total * 200),
  created_at timestamptz not null default now()
);

create index if not exists scores_lesson_score on public.scores (lesson, score desc);

alter table public.scores enable row level security;

drop policy if exists "anyone can read scores" on public.scores;
create policy "anyone can read scores" on public.scores for select to anon using (true);

drop policy if exists "anyone can add a score" on public.scores;
create policy "anyone can add a score" on public.scores for insert to anon with check (true);

grant select, insert on public.scores to anon;
