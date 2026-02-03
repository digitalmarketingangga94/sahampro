CREATE TABLE public.daily_screener_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  template_id TEXT NOT NULL,
  emiten TEXT NOT NULL,
  company_name TEXT,
  screener_data JSONB,
  snapshot_date DATE NOT NULL,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  UNIQUE (template_id, emiten, snapshot_date)
);

ALTER TABLE public.daily_screener_results ENABLE ROW LEVEL SECURITY;

-- Izinkan pengguna terautentikasi untuk membaca hasil screener
CREATE POLICY "Allow authenticated read access to daily_screener_results"
ON public.daily_screener_results FOR SELECT
TO authenticated
USING (true);

-- Kebijakan INSERT, UPDATE, DELETE tidak diperlukan untuk peran layanan (service role)
-- karena RLS dilewati untuk peran layanan, yang akan digunakan oleh Netlify Function.