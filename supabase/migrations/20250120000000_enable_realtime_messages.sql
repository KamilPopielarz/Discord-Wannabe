-- Enable real-time replication for messages table
-- This allows Supabase real-time subscriptions to work with the messages table

-- Add messages table to realtime publication if not already added
-- Note: For partitioned tables, we add the parent table which automatically includes all partitions
-- Check if table exists before adding to publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

