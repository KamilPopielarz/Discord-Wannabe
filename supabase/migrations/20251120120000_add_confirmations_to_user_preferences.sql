-- migration: add confirmations to user_preferences
-- generated at 2025-11-20 12:00:00 UTC

alter table user_preferences
add column if not exists confirmations jsonb not null default jsonb_build_object(
  'deleteMessage', true,
  'createRoom', true,
  'createServer', true
);

