create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  status text not null default 'running',
  checkpoint jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists summaries (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  conversation_id text not null,
  contact_name text not null,
  phone text not null,
  date_range text not null,
  summary text not null,
  topics text[] not null default '{}',
  needs_response boolean not null default false,
  created_at timestamptz not null default now()
);

do $$ begin
  create type draft_status as enum ('pending','approved','rejected','sent');
exception when duplicate_object then null;
end $$;

create table if not exists draft_replies (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  conversation_id text not null,
  phone text not null,
  from_phone_number_id text not null,
  user_id text,
  draft_text text not null,
  status draft_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contact_map (
  phone text primary key,
  contact_id text not null,
  created_at timestamptz not null default now()
);
