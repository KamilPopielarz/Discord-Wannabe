-- migration: add created_at column to user_room table
-- generated at 2025-10-21 12:00:00 UTC

-- Add created_at column to user_room table
alter table user_room
  add column if not exists created_at timestamptz not null default now();

-- For existing rows, set created_at to a reasonable default (e.g., current timestamp)
-- This ensures all existing records have a value
update user_room
  set created_at = now()
  where created_at is null;




