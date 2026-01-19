-- Create agent_stories table for AI story analysis results
CREATE TABLE IF NOT EXISTS agent_stories (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  emiten TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, error
  
  -- Result (nullable until completed)
  matriks_story JSONB,
  swot_analysis JSONB,
  checklist_katalis JSONB,
  strategi_trading JSONB,
  kesimpulan TEXT,
  
  -- Error info
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_stories_emiten ON agent_stories(emiten);
CREATE INDEX IF NOT EXISTS idx_agent_stories_status ON agent_stories(status);
CREATE INDEX IF NOT EXISTS idx_agent_stories_created_at ON agent_stories(created_at DESC);
