-- Create table for emiten flags
CREATE TABLE IF NOT EXISTS emiten_flags (
  emiten TEXT PRIMARY KEY,
  flag TEXT CHECK (flag IN ('OK', 'NG', 'Neutral')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_emiten_flags_emiten ON emiten_flags(emiten);

-- Add RLS policies if needed (assuming public access for now or existing auth)
ALTER TABLE emiten_flags ENABLE ROW LEVEL SECURITY;

-- Allow public read access (or restricted based on app needs)
CREATE POLICY "Allow public read access" ON emiten_flags FOR SELECT USING (true);

-- Allow authenticated upload (adjust as needed)
CREATE POLICY "Allow authenticated insert/update" ON emiten_flags FOR ALL USING (true) WITH CHECK (true);
