-- Migration: Add scheduled analysis support to stock_queries table
-- Run this in your Supabase SQL Editor

-- Add status tracking columns if they don't exist
ALTER TABLE stock_queries 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create unique constraint on (from_date, emiten) to enable upsert
-- This ensures one record per emiten per analysis date
ALTER TABLE stock_queries 
  DROP CONSTRAINT IF EXISTS uq_stock_queries_date_emiten;

ALTER TABLE stock_queries 
  ADD CONSTRAINT uq_stock_queries_date_emiten 
  UNIQUE (from_date, emiten);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_stock_queries_from_date ON stock_queries(from_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_queries_status ON stock_queries(status);

-- Add function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_stock_queries_updated_at ON stock_queries;
CREATE TRIGGER update_stock_queries_updated_at
    BEFORE UPDATE ON stock_queries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
