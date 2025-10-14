-- migration: disable row level security for development
-- generated at 2025-10-14 12:10:00 UTC

alter table auth_sessions disable row level security;
alter table servers disable row level security;
alter table rooms disable row level security;
alter table user_server disable row level security;
alter table user_room disable row level security;
alter table sessions disable row level security;
alter table messages disable row level security;
alter table room_password_attempts disable row level security;
alter table audit_logs disable row level security;
alter table email_confirmations disable row level security;
alter table password_resets disable row level security;
alter table invitation_links disable row level security;
