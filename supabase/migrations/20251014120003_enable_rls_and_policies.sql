-- migration: enable row level security and create policies
-- generated at 2025-10-14 12:00:03 UTC

-- auth_sessions table policies
alter table auth_sessions enable row level security;
create policy select_auth_sessions on auth_sessions for select to authenticated using (user_id = current_setting('app.user_id')::uuid);
create policy insert_auth_sessions on auth_sessions for insert to authenticated with check (user_id = current_setting('app.user_id')::uuid);

-- servers table policies
alter table servers enable row level security;
create policy select_servers_anon on servers for select to anon using (true);
create policy select_servers_auth on servers for select to authenticated using (true);
create policy insert_servers on servers for insert to authenticated with check (true);
create policy update_servers on servers for update to authenticated using (true) with check (true);
create policy delete_servers on servers for delete to authenticated using (true);

-- rooms table policies
alter table rooms enable row level security;
create policy room_select on rooms for select to authenticated using (
  exists (
    select 1 from user_server us
    where us.server_id = rooms.server_id
      and us.user_id = current_setting('app.user_id')::uuid
  )
  or exists (
    select 1 from user_room ur
    where ur.room_id = rooms.id
      and ur.user_id = current_setting('app.user_id')::uuid
  )
);
create policy room_insert on rooms for insert to authenticated with check (
  exists (
    select 1 from user_server us
    where us.server_id = rooms.server_id
      and us.user_id = current_setting('app.user_id')::uuid
  )
);
create policy room_update on rooms for update to authenticated using (
  exists (
    select 1 from user_server us
    where us.server_id = rooms.server_id
      and us.user_id = current_setting('app.user_id')::uuid
  )
) with check (true);
create policy room_delete on rooms for delete to authenticated using (
  exists (
    select 1 from user_server us
    where us.server_id = rooms.server_id
      and us.user_id = current_setting('app.user_id')::uuid
  )
);

-- user_server join table policies
alter table user_server enable row level security;
create policy user_server_manage on user_server for all to authenticated using (
  user_id = current_setting('app.user_id')::uuid
) with check (
  user_id = current_setting('app.user_id')::uuid
);

-- user_room join table policies
alter table user_room enable row level security;
create policy user_room_manage on user_room for all to authenticated using (
  user_id = current_setting('app.user_id')::uuid
) with check (
  user_id = current_setting('app.user_id')::uuid
);

-- sessions table policies
alter table sessions enable row level security;
create policy session_insert on sessions for insert to anon, authenticated with check (true);
create policy session_owner on sessions for all to authenticated using (
  user_id = current_setting('app.user_id')::uuid
) with check (
  user_id = current_setting('app.user_id')::uuid
);

-- messages table policies
alter table messages enable row level security;
create policy message_select on messages for select to authenticated using (
  exists (
    select 1 from user_room ur
    where ur.room_id = messages.room_id
      and ur.user_id = current_setting('app.user_id')::uuid
  )
);
create policy message_insert on messages for insert to authenticated with check (
  exists (
    select 1 from user_room ur
    where ur.room_id = messages.room_id
      and ur.user_id = current_setting('app.user_id')::uuid
  )
);

-- room_password_attempts table policies
alter table room_password_attempts enable row level security;
create policy attempts_manage on room_password_attempts for all to authenticated using (
  exists (
    select 1 from user_room ur
    where ur.room_id = room_password_attempts.room_id
      and ur.user_id = current_setting('app.user_id')::uuid
  )
) with check (true);

-- audit_logs table policies
alter table audit_logs enable row level security;
create policy audit_select on audit_logs for select to authenticated using (
  exists (
    select 1 from user_server us
    where us.server_id = audit_logs.target_id
      and us.user_id = current_setting('app.user_id')::uuid
      and us.role in ('Owner','Admin')
  )
);

-- rate_limits table policies
alter table rate_limits enable row level security;
-- no policies: managed by service role bypassing RLS

-- email_confirmations table policies
alter table email_confirmations enable row level security;
create policy email_confirm_select on email_confirmations for select to authenticated using (user_id = current_setting('app.user_id')::uuid);
create policy email_confirm_insert on email_confirmations for insert to authenticated with check (user_id = current_setting('app.user_id')::uuid);

-- password_resets table policies
alter table password_resets enable row level security;
create policy password_reset_select on password_resets for select to authenticated using (user_id = current_setting('app.user_id')::uuid);
create policy password_reset_insert on password_resets for insert to authenticated with check (user_id = current_setting('app.user_id')::uuid);

-- invitation_links table policies
alter table invitation_links enable row level security;
create policy invitation_select on invitation_links for select to authenticated using (
  (server_id is not null and exists (
    select 1 from user_server us
    where us.server_id = invitation_links.server_id
      and us.user_id = current_setting('app.user_id')::uuid
  ))
  or (room_id is not null and exists (
    select 1 from user_room ur
    where ur.room_id = invitation_links.room_id
      and ur.user_id = current_setting('app.user_id')::uuid
  ))
);
create policy invitation_insert on invitation_links for insert to authenticated with check (
  (server_id is not null and exists (
    select 1 from user_server us
    where us.server_id = invitation_links.server_id
      and us.user_id = current_setting('app.user_id')::uuid
  ))
  or (room_id is not null and exists (
    select 1 from user_room ur
    where ur.room_id = invitation_links.room_id
      and ur.user_id = current_setting('app.user_id')::uuid
  ))
);
