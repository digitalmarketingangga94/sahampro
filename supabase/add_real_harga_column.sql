-- Migration: Add real_harga column to stock_queries table
ALTER TABLE stock_queries ADD COLUMN IF NOT EXISTS real_harga NUMERIC;
