-- migration: create user_presence table for tracking online users in rooms
-- generated at 2025-10-25 00:00:01 UTC

create table if not exists user_presence (
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  last_seen timestamptz not null default now(),
  primary key (user_id, room_id)
);

-- Index for efficient queries by room_id and last_seen
create index if not exists idx_user_presence_room_last_seen on user_presence(room_id, last_seen desc);

-- Index for cleaning up old presence records
create index if not exists idx_user_presence_last_seen on user_presence(last_seen);

-- Disable RLS for development (consistent with other tables)
alter table user_presence disable row level security;

