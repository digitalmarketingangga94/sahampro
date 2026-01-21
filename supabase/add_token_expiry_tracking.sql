-- Migration: Add token expiry tracking columns to session table
-- Run this in your Supabase SQL Editor

-- Add new columns for token management
ALTER TABLE session 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN session.expires_at IS 'When the token is expected to expire';
COMMENT ON COLUMN session.last_used_at IS 'Last time the token was successfully used for API call';
COMMENT ON COLUMN session.is_valid IS 'Whether the token is still valid (false if 401 received)';
