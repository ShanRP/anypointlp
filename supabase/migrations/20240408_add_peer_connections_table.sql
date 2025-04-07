
-- Create table for user peer connections if it doesn't exist yet
CREATE TABLE IF NOT EXISTS apl_peer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  peer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_peer_connections_user_id ON apl_peer_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_connections_peer_id ON apl_peer_connections(peer_id);

-- Enable row level security
ALTER TABLE apl_peer_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view all peer connections
CREATE POLICY "Users can view all peer connections"
  ON apl_peer_connections FOR SELECT
  USING (true);

-- Users can insert their own peer connections
CREATE POLICY "Users can insert their own peer connections"
  ON apl_peer_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own peer connections
CREATE POLICY "Users can update their own peer connections"
  ON apl_peer_connections FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own peer connections
CREATE POLICY "Users can delete their own peer connections"
  ON apl_peer_connections FOR DELETE
  USING (auth.uid() = user_id);
