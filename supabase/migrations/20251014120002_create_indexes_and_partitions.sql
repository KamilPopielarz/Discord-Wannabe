-- migration: create indexes and partitioning
-- generated at 2025-10-14 12:00:02 UTC

-- index to speed up queries by room and recent messages
create index on messages (room_id, created_at desc);

-- partial index on servers for active recent servers
create index on servers (last_activity);

-- index on rooms for filtering by server, permanence, and activity
create index on rooms (server_id, is_permanent, last_activity);

-- indexes for join tables
create index on user_server (server_id);
create index on user_room (room_id);

-- index on sessions expiry for cleanup
create index on sessions (expires_at);

-- index on room_password_attempts for login throttling
create index on room_password_attempts (room_id, ip_address);

-- index on auth_sessions for session cleanup
create index on auth_sessions (expires_at);

-- indexes for audit logs queries
create index on audit_logs (actor_id);
create index on audit_logs (target_type, target_id);

-- index on invitation_links expiry for cleanup
create index on invitation_links (expires_at);
