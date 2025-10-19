-- Fix foreign key constraint for messages.session_id
-- The constraint should reference auth_sessions, not sessions

-- Drop the existing foreign key constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_session_id_fkey;

-- Add new foreign key constraint to auth_sessions
ALTER TABLE messages ADD CONSTRAINT messages_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES auth_sessions(session_id) ON DELETE SET NULL;
