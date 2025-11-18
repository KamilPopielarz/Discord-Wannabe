-- migration: create user profile & preference tables plus session metadata
-- generated at 2025-11-18 18:00:00 UTC

create extension if not exists citext;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text check (char_length(display_name) <= 80),
  status text check (char_length(status) <= 140),
  bio text,
  timezone text,
  avatar_url text,
  social jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger user_profiles_set_updated_at
before update on user_profiles
for each row execute function public.handle_updated_at();

create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications jsonb not null default jsonb_build_object(
    'push', true,
    'email', true,
    'mentions', true,
    'digest', 'daily'
  ),
  appearance jsonb not null default jsonb_build_object(
    'theme', 'system',
    'fontScale', 1,
    'highContrast', false,
    'reducedMotion', false,
    'chatDensity', 'comfortable'
  ),
  privacy jsonb not null default jsonb_build_object(
    'showPresence', true,
    'autoMuteVoice', false,
    'autoDeafenVoice', false,
    'allowDmFromNonMutual', true,
    'shareActivityInsights', false,
    'twoFactorEnabled', false,
    'twoFactorSecret', null
  ),
  sound jsonb not null default jsonb_build_object(
    'enabled', true,
    'volume', 0.5,
    'messageSound', true,
    'typingSound', false,
    'userJoinSound', true
  ),
  theme text generated always as (
    coalesce(appearance ->> 'theme', 'system')
  ) stored,
  presence_visible boolean generated always as (
    coalesce((privacy ->> 'showPresence')::boolean, true)
  ) stored,
  updated_at timestamptz not null default now()
);

create trigger user_preferences_set_updated_at
before update on user_preferences
for each row execute function public.handle_updated_at();

alter table user_preferences disable row level security;
alter table user_profiles disable row level security;

alter table auth_sessions
  add column if not exists ip_address text,
  add column if not exists user_agent text,
  add column if not exists last_seen timestamptz not null default now();

create index if not exists idx_auth_sessions_user_id on auth_sessions(user_id);
create index if not exists idx_auth_sessions_last_seen on auth_sessions(last_seen desc);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

