-- Create partitions for messages table
-- The messages table is partitioned by created_at (RANGE)

-- Create partition for October 2024
CREATE TABLE IF NOT EXISTS messages_2024_10 PARTITION OF messages 
FOR VALUES FROM ('2024-10-01 00:00:00') TO ('2024-11-01 00:00:00');

-- Create partition for November 2024  
CREATE TABLE IF NOT EXISTS messages_2024_11 PARTITION OF messages
FOR VALUES FROM ('2024-11-01 00:00:00') TO ('2024-12-01 00:00:00');

-- Create partition for December 2024
CREATE TABLE IF NOT EXISTS messages_2024_12 PARTITION OF messages
FOR VALUES FROM ('2024-12-01 00:00:00') TO ('2025-01-01 00:00:00');

-- Create partition for January 2025
CREATE TABLE IF NOT EXISTS messages_2025_01 PARTITION OF messages
FOR VALUES FROM ('2025-01-01 00:00:00') TO ('2025-02-01 00:00:00');

-- Create partition for February 2025
CREATE TABLE IF NOT EXISTS messages_2025_02 PARTITION OF messages
For VALUES FROM ('2025-02-01 00:00:00') TO ('2025-03-01 00:00:00');

-- Create partition for March 2025
CREATE TABLE IF NOT EXISTS messages_2025_03 PARTITION OF messages
FOR VALUES FROM ('2025-03-01 00:00:00') TO ('2025-04-01 00:00:00');

-- Create partition for April 2025
CREATE TABLE IF NOT EXISTS messages_2025_04 PARTITION OF messages
FOR VALUES FROM ('2025-04-01 00:00:00') TO ('2025-05-01 00:00:00');

-- Create partition for May 2025
CREATE TABLE IF NOT EXISTS messages_2025_05 PARTITION OF messages
FOR VALUES FROM ('2025-05-01 00:00:00') TO ('2025-06-01 00:00:00');

-- Create partition for June 2025
CREATE TABLE IF NOT EXISTS messages_2025_06 PARTITION OF messages
FOR VALUES FROM ('2025-06-01 00:00:00') TO ('2025-07-01 00:00:00');

-- Create partition for July 2025
CREATE TABLE IF NOT EXISTS messages_2025_07 PARTITION OF messages
FOR VALUES FROM ('2025-07-01 00:00:00') TO ('2025-08-01 00:00:00');

-- Create partition for August 2025
CREATE TABLE IF NOT EXISTS messages_2025_08 PARTITION OF messages
FOR VALUES FROM ('2025-08-01 00:00:00') TO ('2025-09-01 00:00:00');

-- Create partition for September 2025
CREATE TABLE IF NOT EXISTS messages_2025_09 PARTITION OF messages
FOR VALUES FROM ('2025-09-01 00:00:00') TO ('2025-10-01 00:00:00');

-- Create partition for October 2025 (current month)
CREATE TABLE IF NOT EXISTS messages_2025_10 PARTITION OF messages
FOR VALUES FROM ('2025-10-01 00:00:00') TO ('2025-11-01 00:00:00');

-- Create partition for November 2025
CREATE TABLE IF NOT EXISTS messages_2025_11 PARTITION OF messages
FOR VALUES FROM ('2025-11-01 00:00:00') TO ('2025-12-01 00:00:00');

-- Create partition for December 2025
CREATE TABLE IF NOT EXISTS messages_2025_12 PARTITION OF messages
FOR VALUES FROM ('2025-12-01 00:00:00') TO ('2026-01-01 00:00:00');
