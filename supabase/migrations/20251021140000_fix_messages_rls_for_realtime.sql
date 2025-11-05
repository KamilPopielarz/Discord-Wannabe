-- Fix RLS policies for messages table to work with real-time subscriptions
-- Change from current_setting('app.user_id') to auth.uid() which works in real-time

-- Drop existing message policies
DROP POLICY IF EXISTS message_select ON messages;
DROP POLICY IF EXISTS message_insert ON messages;

-- Create new policies using auth.uid() instead of current_setting
-- This allows real-time subscriptions to work properly
CREATE POLICY message_select ON messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_room ur
    WHERE ur.room_id = messages.room_id
      AND ur.user_id = auth.uid()
  )
  OR EXISTS (
    -- Also allow if user is member of the server that contains this room
    SELECT 1 FROM user_server us
    INNER JOIN rooms r ON r.server_id = us.server_id
    WHERE r.id = messages.room_id
      AND us.user_id = auth.uid()
  )
);

CREATE POLICY message_insert ON messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_room ur
    WHERE ur.room_id = messages.room_id
      AND ur.user_id = auth.uid()
  )
  OR EXISTS (
    -- Also allow if user is member of the server that contains this room
    SELECT 1 FROM user_server us
    INNER JOIN rooms r ON r.server_id = us.server_id
    WHERE r.id = messages.room_id
      AND us.user_id = auth.uid()
  )
);

