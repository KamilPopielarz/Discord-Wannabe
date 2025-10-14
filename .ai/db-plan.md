# Database Schema Plan for PostgreSQL

## 1. Tables

### users
- *Note*: Tabela `users` jest zarządzana przez Supabase Auth; synchronizowana automatycznie i nie modyfikować ręcznie.
- email: TEXT UNIQUE NOT NULL
- password_hash: TEXT NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- is_active: BOOLEAN NOT NULL DEFAULT false

### auth_sessions
- session_id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- access_token: TEXT NOT NULL
- refresh_token: TEXT NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- expires_at: TIMESTAMPTZ NOT NULL

### servers
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- invite_link: TEXT UNIQUE NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- last_activity: TIMESTAMPTZ NOT NULL DEFAULT now()

### rooms
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- server_id: UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE
- name: TEXT NOT NULL
- invite_link: TEXT UNIQUE NOT NULL
- password_hash: TEXT NULL
- is_permanent: BOOLEAN NOT NULL DEFAULT false
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- last_activity: TIMESTAMPTZ NOT NULL DEFAULT now()

### user_server
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- server_id: UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE
- role: TEXT NOT NULL CHECK (role IN ('Owner','Admin','Moderator','Member','Guest'))
- PRIMARY KEY (user_id, server_id)

### user_room
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- room_id: UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE
- role: TEXT NOT NULL CHECK (role IN ('Owner','Admin','Moderator','Member','Guest'))
- PRIMARY KEY (user_id, room_id)

### sessions
- session_id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NULL REFERENCES users(id) ON DELETE SET NULL
- guest_nick: TEXT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- expires_at: TIMESTAMPTZ NOT NULL

### messages (PARTITIONED BY RANGE)
- id: BIGSERIAL NOT NULL
- room_id: UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE
- user_id: UUID NULL REFERENCES users(id) ON DELETE SET NULL
- session_id: UUID NULL REFERENCES sessions(session_id) ON DELETE SET NULL
- content: TEXT NOT NULL
- metadata: JSONB NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- PRIMARY KEY (id, created_at)
- PARTITION BY RANGE (created_at)

### room_password_attempts
- id: SERIAL PRIMARY KEY
- room_id: UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE
- ip_address: INET NOT NULL
- attempts: INT NOT NULL DEFAULT 0
- blocked_until: TIMESTAMPTZ NULL

### audit_logs (PARTITIONED BY RANGE)
- id: BIGSERIAL PRIMARY KEY
- actor_id: UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL
- action: TEXT NOT NULL
- target_type: TEXT NOT NULL
- target_id: UUID NOT NULL
- metadata: JSONB NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- PARTITION BY RANGE (created_at)

### rate_limits
- entity_type: TEXT NOT NULL
- entity_id: UUID NOT NULL
- window_start: TIMESTAMPTZ NOT NULL
- count: INT NOT NULL DEFAULT 0
- PRIMARY KEY (entity_type, entity_id, window_start)

### email_confirmations
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- token: TEXT NOT NULL UNIQUE
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- expires_at: TIMESTAMPTZ NOT NULL
- used: BOOLEAN NOT NULL DEFAULT false

### password_resets
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- token: TEXT NOT NULL UNIQUE
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- expires_at: TIMESTAMPTZ NOT NULL
- used: BOOLEAN NOT NULL DEFAULT false

### invitation_links
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- server_id: UUID NULL REFERENCES servers(id) ON DELETE CASCADE
- room_id: UUID NULL REFERENCES rooms(id) ON DELETE CASCADE
- link: TEXT UNIQUE NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- expires_at: TIMESTAMPTZ NULL
- max_uses: INT NULL
- uses: INT NOT NULL DEFAULT 0
- revoked: BOOLEAN NOT NULL DEFAULT false
- CHECK ((server_id IS NOT NULL) OR (room_id IS NOT NULL))


## 2. Relationships
- Server 1–N Room (`rooms.server_id → servers.id`)
- User N–M Server (`user_server` intermediate table)
- User N–M Room (`user_room` intermediate table)
- Session 1–N Message (`messages.session_id → sessions.session_id`)
- User 1–N Message (`messages.user_id → users.id`)


## 3. Indexes
- `CREATE INDEX ON messages (room_id, created_at DESC);`
- `CREATE INDEX ON servers (last_activity) WHERE last_activity > now() - INTERVAL '6 hours';`
- `CREATE INDEX ON rooms (server_id, is_permanent, last_activity);`
- `CREATE INDEX ON user_server (server_id);`
- `CREATE INDEX ON user_room (room_id);`
- `CREATE INDEX ON sessions (expires_at);`
- `CREATE INDEX ON room_password_attempts (room_id, ip_address);`
- `CREATE INDEX ON auth_sessions (expires_at);`
- `CREATE INDEX ON audit_logs (actor_id);`
- `CREATE INDEX ON audit_logs (target_type, target_id);`
- `CREATE INDEX ON invitation_links (expires_at);`


## 4. PostgreSQL RLS Policies

### rooms
```sql
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY room_access ON rooms
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_server us
        WHERE us.server_id = rooms.server_id
          AND us.user_id = current_setting('app.user_id')::uuid
      )
      OR
      EXISTS (
        SELECT 1 FROM user_room ur
        WHERE ur.room_id = rooms.id
          AND ur.user_id = current_setting('app.user_id')::uuid
      )
);
```

### messages
```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY message_access ON messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM user_room ur
        WHERE ur.room_id = messages.room_id
          AND ur.user_id = current_setting('app.user_id')::uuid
      )
);
CREATE POLICY message_insert ON messages
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_room ur
        WHERE ur.room_id = messages.room_id
          AND ur.user_id = current_setting('app.user_id')::uuid
      )
);
```

### audit_logs
```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_select ON audit_logs
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM user_server us
        WHERE us.server_id = audit_logs.target_id
          AND us.user_id = current_setting('app.user_id')::uuid
          AND us.role IN ('Owner','Admin')
      )
);
```

### auth_sessions
```sql
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_session_users ON auth_sessions
    FOR SELECT USING (
      user_id = current_setting('app.user_id')::uuid
    );
```


## 5. Additional Notes
- Partition daily retention for `messages` (drop partitions >1 day old via scheduled function).
- Partition monthly retention for `audit_logs` (drop partitions >90 days old).
- Use Supabase Scheduled Functions for TTL cleanup (servers, sessions, partitions).
- Unresolved: invitation link revocation policies, DSR export/anonymization workflows, OAuth/social logins integration.
