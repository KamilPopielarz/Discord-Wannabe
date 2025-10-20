-- migration: add username to auth_sessions table
-- generated at 2025-10-20 15:00:00 UTC

-- Add username column to auth_sessions table
alter table auth_sessions add column username text null;

-- Create index for faster username lookups
create index on auth_sessions (username);
