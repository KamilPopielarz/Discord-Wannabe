-- migration: add name column to servers table
-- generated at 2025-10-25 00:00:00 UTC

-- Add name column to servers table (if it doesn't exist)
-- Using DO block to safely check if column exists before adding
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'servers' and column_name = 'name'
  ) then
    alter table servers add column name text null;
  end if;
end $$;

-- Create index for faster name lookups (if it doesn't exist)
-- Note: PostgreSQL doesn't support IF NOT EXISTS for indexes in older versions
-- We'll create it conditionally using DO block
do $$
begin
  if not exists (
    select 1 from pg_indexes 
    where tablename = 'servers' and indexname = 'servers_name_idx'
  ) then
    create index servers_name_idx on servers (name);
  end if;
end $$;


