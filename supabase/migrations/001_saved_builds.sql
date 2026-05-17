create table if not exists saved_builds (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  slug        text unique not null,
  role        text not null,
  killer_id   text,
  mode        text not null,
  seed        bigint not null,
  pinned_state jsonb,
  note        text,
  created_at  timestamptz default now()
);

-- Index for user's own builds list
create index if not exists saved_builds_user_id_idx on saved_builds (user_id, created_at desc);

-- RLS
alter table saved_builds enable row level security;

-- Anyone can read any saved build (share links are public)
create policy "saved_builds_select_public"
  on saved_builds for select
  using (true);

-- Only authenticated owner can insert
create policy "saved_builds_insert_owner"
  on saved_builds for insert
  with check (auth.uid() = user_id);

-- Owner can delete their own builds
create policy "saved_builds_delete_owner"
  on saved_builds for delete
  using (auth.uid() = user_id);
