create extension if not exists pgcrypto;

create table if not exists public.content_rows (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  run_date_key text not null unique,
  topic text not null default '',
  linkedin_post text not null default '',
  medium_article text not null default '',
  ig_script text not null default '',
  yt_script text not null default '',
  devto_article text not null default '',
  status text not null default 'Pending',
  linkedin_image_url text not null default '',
  medium_image_url text not null default '',
  ig_image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_agent text not null default 'System',
  error_message text not null default '',
  linkedin_publish_status text not null default 'Not Started',
  linkedin_post_id text not null default '',
  linkedin_url text not null default '',
  linkedin_published_at timestamptz null,
  devto_publish_status text not null default 'Not Started',
  devto_article_id text not null default '',
  devto_url text not null default '',
  devto_published_at timestamptz null,
  publish_errors text not null default '',
  image_provider text not null default '',
  image_generated_at timestamptz null,
  image_error text not null default ''
);

create table if not exists public.pipeline_state (
  id text primary key,
  is_running boolean not null default false,
  current_step text not null default 'idle',
  last_run_at timestamptz null,
  last_error text null,
  current_topic text null,
  next_scheduled_run text null,
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  run_date_key text null,
  content_row_id uuid null references public.content_rows(id) on delete set null,
  agent text not null,
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_content_rows_run_date_key on public.content_rows (run_date_key);
create index if not exists idx_content_rows_created_at on public.content_rows (created_at desc);
create index if not exists idx_activity_logs_run_date_key on public.activity_logs (run_date_key);
create index if not exists idx_activity_logs_created_at on public.activity_logs (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_content_rows_updated_at on public.content_rows;
create trigger trg_content_rows_updated_at
before update on public.content_rows
for each row
execute function public.set_updated_at();

drop trigger if exists trg_pipeline_state_updated_at on public.pipeline_state;
create trigger trg_pipeline_state_updated_at
before update on public.pipeline_state
for each row
execute function public.set_updated_at();

insert into public.pipeline_state (id)
values ('main')
on conflict (id) do nothing;