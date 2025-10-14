-- migration: create tables and relationships
-- generated at 2025-10-14 12:00:01 UTC

-- note: users table is managed by supabase auth and is not created here

create table if not exists auth_sessions (
  session_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists servers (
  id uuid primary key default gen_random_uuid(),
  invite_link text unique not null,
  created_at timestamptz not null default now(),
  last_activity timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers(id) on delete cascade,
  name text not null,
  invite_link text unique not null,
  password_hash text null,
  is_permanent boolean not null default false,
  created_at timestamptz not null default now(),
  last_activity timestamptz not null default now()
);

create table if not exists user_server (
  user_id uuid not null references auth.users(id) on delete cascade,
  server_id uuid not null references servers(id) on delete cascade,
  role text not null check (role in ('Owner','Admin','Moderator','Member','Guest')),
  primary key (user_id, server_id)
);

create table if not exists user_room (
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  role text not null check (role in ('Owner','Admin','Moderator','Member','Guest')),
  primary key (user_id, room_id)
);

create table if not exists sessions (
  session_id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  guest_nick text null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists messages (
  id bigserial not null,
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  session_id uuid null references sessions(session_id) on delete set null,
  content text not null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  primary key (id, created_at)
) partition by range (created_at);

create table if not exists room_password_attempts (
  id serial primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  ip_address inet not null,
  attempts int not null default 0,
  blocked_until timestamptz null
);

create table if not exists audit_logs (
  id bigserial not null,
  actor_id uuid not null references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  metadata jsonb null,
  created_at timestamptz not null default now()
) partition by range (created_at);

create table if not exists rate_limits (
  entity_type text not null,
  entity_id uuid not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (entity_type, entity_id, window_start)
);

create table if not exists email_confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

create table if not exists invitation_links (
  id uuid primary key default gen_random_uuid(),
  server_id uuid null references servers(id) on delete cascade,
  room_id uuid null references rooms(id) on delete cascade,
  link text unique not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  max_uses int null,
  uses int not null default 0,
  revoked boolean not null default false,
  check ((server_id is not null) or (room_id is not null))
);
