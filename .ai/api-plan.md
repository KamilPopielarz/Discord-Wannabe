# REST API Plan

## 1. Resources
- User (users)
- Auth Session (auth_sessions)
- Server (servers)
- Room (rooms)
- User–Server Membership (user_server)
- User–Room Membership (user_room)
- Guest Session (sessions)
- Message (messages)
- Room Password Attempt (room_password_attempts)
- Audit Log (audit_logs)
- Rate Limit (rate_limits)
- Email Confirmation (email_confirmations)
- Password Reset (password_resets)
- Invitation Link (invitation_links)

## 2. Endpoints

### 2.1 Authentication & User Management
POST /api/auth/register
- Description: Register user with email+password and send confirmation link
- Request: { email: string, password: string }
- Response (201): { userId: UUID }
- Errors: 400 invalid input, 409 email exists

POST /api/auth/confirm
- Description: Confirm email using token
- Request: { token: string }
- Response: 200 OK
- Errors: 400 invalid/expired token

POST /api/auth/login
- Description: Authenticate user, set secure httpOnly cookie
- Request: { email: string, password: string }
- Response: 200 OK
- Errors: 401 invalid creds, 429 too many attempts

POST /api/auth/logout
- Description: Invalidate session
- Response: 204 No Content

POST /api/auth/password-reset/request
- Description: Send password reset link with CAPTCHA
- Request: { email: string, captchaToken: string }
- Response: 200 OK

POST /api/auth/password-reset/confirm
- Description: Set new password and invalidate old sessions
- Request: { token: string, newPassword: string }
- Response: 200 OK
- Errors: 400 invalid/expired token

### 2.2 Guest Session
POST /api/guest
- Description: Create 24h guest session, returns guestNick
- Request: { serverInviteLink: string }
- Response: { sessionId: UUID, guestNick: string }

### 2.3 Servers
GET /api/servers/:inviteLink
- Description: Resolve invite link, return server metadata
- Response: { serverId, name?, ttlExpiresAt }

POST /api/servers
- Description: Create a server (authenticated)
- Request: { }
- Response (201): { serverId, inviteLink }

DELETE /api/servers/:serverId
- Description: Delete server (Owner)
- Response: 204 No Content

### 2.4 Rooms
POST /api/servers/:serverId/rooms
- Description: Create room with optional password
- Request: { name: string, password?: string }
- Response: { roomId, inviteLink }

GET /api/rooms/:inviteLink
- Description: Resolve room link, indicate if password required
- Response: { roomId, requiresPassword: boolean }

POST /api/rooms/:roomId/join
- Description: Join room by invite link+password
- Request: { password?: string }
- Response: 200 OK
- Errors: 401 wrong password, 429 too many attempts

DELETE /api/rooms/:roomId
- Description: Delete room (Owner/Admin)
- Response: 204 No Content

PATCH /api/rooms/:roomId/password
- Description: Reset room password (Owner)
- Request: { password: string }
- Response: 200 OK

### 2.5 Membership & Roles
PATCH /api/servers/:serverId/members/:userId/role
- Description: Change user role in server (Owner/Admin)
- Request: { role: string }
- Response: 200 OK

PATCH /api/rooms/:roomId/members/:userId/role
- Description: Change user role in room
- Request: { role: string }
- Response: 200 OK

### 2.6 Messages & Chat
GET /api/rooms/:roomId/messages
- Description: List messages with pagination, filtering, sorting
- Query: page, limit, since
- Response: { messages: [ { id, userId?, sessionId?, content, metadata, createdAt } ], nextPage }

POST /api/rooms/:roomId/messages
- Description: Send message (text, emoji, GIF, link)
- Request: { content: string }
- Response: { messageId, createdAt }

DELETE /api/rooms/:roomId/messages/:messageId
- Description: Delete message (self or Moderator+)
- Response: 204 No Content

### 2.7 Anti-spam & Rate Limits
Implemented transparently via database triggers and middleware using rate_limits table
(endpoints reuse existing create-message logic)

### 2.8 Invitation Links
GET /api/invites/:link
- Description: Resolve invitation to server or room
- Response: { type: "server"|"room", id, expiresAt, usesLeft }

POST /api/invites/:link/revoke
- Description: Revoke or update invite settings
- Request: { expiresAt?: ISODate, maxUses?: number, revoked: boolean }
- Response: 200 OK

### 2.9 Admin Panel
GET /api/servers/:serverId/logs
- Description: View audit logs (Admin+)
- Query: page, limit
- Response: { logs }

### 2.10 Voice Token
POST /api/rooms/:roomId/voice-token
- Description: Generate LiveKit access token with appropriate permissions
- Request: { permissions: string[] }
- Response: { token: string }

### 2.11 Data Export & DSR
GET /api/users/:userId/export
- Description: Export user data (JSON)
- Response: { data }

DELETE /api/users/:userId
- Description: Anonymize or delete user data per retention
- Response: 204 No Content

## 3. Authentication & Authorization
- Use Supabase Auth with secure httpOnly cookies (SameSite=Strict, Secure)
- RLS enforces row-level security for rooms, messages, audit_logs, auth_sessions
- JWT or session-based checking in edge functions
- Role checks in middleware (Owner/Admin/Moderator)

## 4. Validation & Business Logic
- Validate email format, password strength; enforce unique constraints (users.email)
- Enforce room password Argon2id hashing & 3-attempt limit via room_password_attempts
- TTL enforcement in scheduled functions for servers and message retention
- Rate limit per user/IP using rate_limits table and middleware
- Pagination limits and input sanitization
- Link preview SSRF hardening in server-side preview endpoint
- Business logic endpoints for TTL extension and speak-by-permission implemented in Supabase Edge functions
