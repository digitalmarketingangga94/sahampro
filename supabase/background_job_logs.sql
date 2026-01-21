-- Create background_job_logs table for tracking background job executions
CREATE TABLE IF NOT EXISTS background_job_logs (
  id SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  log_entries JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_background_job_logs_job_name ON background_job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_background_job_logs_status ON background_job_logs(status);
CREATE INDEX IF NOT EXISTS idx_background_job_logs_started_at ON background_job_logs(started_at DESC);
