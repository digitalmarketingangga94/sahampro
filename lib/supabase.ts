
import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env missing');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Save stock query to database
 */
export async function saveStockQuery(data: {
  emiten: string;
  sector?: string;
  from_date?: string;
  to_date?: string;
  bandar?: string;
  barang_bandar?: number;
  rata_rata_bandar?: number;
  harga?: number;
  ara?: number;
  arb?: number;
  fraksi?: number;
  total_bid?: number;
  total_offer?: number;
  total_papan?: number;
  rata_rata_bid_ofer?: number;
  a?: number;
  p?: number;
  target_realistis?: number;
  target_max?: number;
}) {

  const supabase = getSupabase();
  const { data: result, error } = await supabase
    .from('stock_queries')
    .upsert([data], { onConflict: 'from_date,emiten' })
    .select();

  if (error) {
    console.error('Error saving to Supabase:', error);
    throw error;
  }

  return result;
}

/**
 * Get session value by key
 */
export async function getSessionValue(key: string): Promise<string | null> {

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('session')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return data.value;
}

/**
 * Upsert session value with optional expiry
 */
export async function upsertSession(
  key: string, 
  value: string, 
  expiresAt?: Date
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('session')
    .upsert(
      { 
        key, 
        value, 
        updated_at: new Date().toISOString(),
        expires_at: expiresAt?.toISOString() || null,
        is_valid: true,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
    .select();

  if (error) throw error;
  return data;
}

/**
 * Save watchlist analysis to database (reusing stock_queries table)
 */
export async function saveWatchlistAnalysis(data: {
  from_date: string;  // analysis date
  to_date: string;    // same as from_date for daily analysis
  emiten: string;
  sector?: string;
  bandar?: string;
  barang_bandar?: number;
  rata_rata_bandar?: number;
  harga?: number;
  ara?: number;       // offer_teratas
  arb?: number;       // bid_terbawah
  fraksi?: number;
  total_bid?: number;
  total_offer?: number;
  total_papan?: number;
  rata_rata_bid_ofer?: number;
  a?: number;
  p?: number;
  target_realistis?: number;
  target_max?: number;
  status?: string;
  error_message?: string;
}) {

  const supabase = getSupabase();
  const { data: result, error } = await supabase
    .from('stock_queries')
    .upsert([data], { onConflict: 'from_date,emiten' })
    .select();

  if (error) {
    console.error('Error saving watchlist analysis:', error);
    throw error;
  }

  return result;
}

/**
 * Get watchlist analysis history with optional filters
 */
export async function getWatchlistAnalysisHistory(filters?: {
  emiten?: string;
  sector?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {

  const supabase = getSupabase();
  let query = supabase
    .from('stock_queries')
    .select('*', { count: 'exact' });

  // Handle sorting
  const sortBy = filters?.sortBy || 'from_date';
  const sortOrder = filters?.sortOrder || 'desc';

  if (sortBy === 'combined') {
    // Sort by date then emiten
    query = query
      .order('from_date', { ascending: sortOrder === 'asc' })
      .order('emiten', { ascending: sortOrder === 'asc' });
  } else if (sortBy === 'emiten') {
    // When sorting by emiten, secondary sort by date ascending
    query = query
      .order('emiten', { ascending: sortOrder === 'asc' })
      .order('from_date', { ascending: true });
  } else {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  }

  if (filters?.emiten) {
    const emitenList = filters.emiten.split(/\s+/).filter(Boolean);
    if (emitenList.length > 0) { // Changed to always use .in() if emitens are present
      query = query.in('emiten', emitenList);
    }
  }
  if (filters?.sector) {
    query = query.eq('sector', filters.sector);
  }
  if (filters?.fromDate) {
    query = query.gte('from_date', filters.fromDate);
  }
  if (filters?.toDate) {
    query = query.lte('from_date', filters.toDate);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching watchlist analysis:', error);
    throw error;
  }

  return { data, count };
}

/**
 * Get latest stock query for a specific emiten
 */

export async function getLatestStockQuery(emiten: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stock_queries')
    .select('*')
    .eq('emiten', emiten)
    .eq('status', 'success')
    .order('from_date', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

/**
 * Update the most recent previous day's real price for an emiten
 */

export async function updatePreviousDayRealPrice(emiten: string, currentDate: string, price: number) {
  const supabase = getSupabase();
  // 1. Find the latest successful record before currentDate
  const { data: record, error: findError } = await supabase
    .from('stock_queries')
    .select('id, from_date')
    .eq('emiten', emiten)
    .eq('status', 'success')
    .lt('from_date', currentDate)
    .order('from_date', { ascending: false })
    .limit(1)
    .single();

  if (findError || !record) {
    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error(`Error finding previous record for ${emiten} before ${currentDate}:`, findError);
    }
    return null;
  }

  // 2. Update that record with the new price
  const { data, error: updateError } = await supabase
    .from('stock_queries')
    .update({ real_harga: price })
    .eq('id', record.id)
    .select();

  if (updateError) {
    console.error(`Error updating real_harga for ${emiten} on ${record.from_date}:`, updateError);
  }

  return data;
}

/**
 * Create a new agent story record with pending status
 */

export async function createAgentStory(emiten: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('agent_stories')
    .insert({ emiten, status: 'pending' })
    .select()
    .single();

  if (error) {
    console.error('Error creating agent story:', error);
    throw error;
  }

  return data;
}

/**
 * Update agent story with result or error
 */

export async function updateAgentStory(id: number, data: {
  status: 'processing' | 'completed' | 'error';
  matriks_story?: object[];
  swot_analysis?: object;
  checklist_katalis?: object[];
  keystat_signal?: string;
  strategi_trading?: object;
  kesimpulan?: string;
  error_message?: string;
}) {
  const supabase = getSupabase();
  const { data: result, error } = await supabase
    .from('agent_stories')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating agent story:', error);
    throw error;
  }

  return result;
}

/**
 * Get latest agent story for an emiten
 */

export async function getAgentStoryByEmiten(emiten: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('agent_stories')
    .select('*')
    .eq('emiten', emiten.toUpperCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching agent story:', error);
  }

  return data || null;
}

/**
 * Get all agent stories for an emiten
 */

export async function getAgentStoriesByEmiten(emiten: string, limit: number = 20) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('agent_stories')
    .select('*')
    .eq('emiten', emiten.toUpperCase())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching agent stories:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new background job log entry
 */
export async function createBackgroundJobLog(jobName: string, totalItems: number = 0) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('background_job_logs')
    .insert({
      job_name: jobName,
      status: 'running',
      total_items: totalItems,
      log_entries: [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating background job log:', error);
    throw error;
  }

  return data;
}

/**
 * Append a log entry to an existing job log
 */
export async function appendBackgroundJobLogEntry(
  jobId: number,
  entry: {
    level: 'info' | 'warn' | 'error';
    message: string;
    emiten?: string;
    details?: Record<string, unknown>;
  }
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const supabase = getSupabase();
  
  // Use raw SQL to append to JSONB array for atomic operation
  const { error } = await supabase.rpc('append_job_log_entry', {
    p_job_id: jobId,
    p_entry: logEntry,
  });

  // If RPC doesn't exist, fallback to fetch-and-update
  if (error && error.code === 'PGRST202') {
    const { data: current } = await supabase
      .from('background_job_logs')
      .select('log_entries')
      .eq('id', jobId)
      .single();

    const entries = current?.log_entries || [];
    entries.push(logEntry);

    await supabase
      .from('background_job_logs')
      .update({ log_entries: entries })
      .eq('id', jobId);
  } else if (error) {
    console.error('Error appending job log entry:', error);
  }
}

/**
 * Update background job log with final status
 */
export async function updateBackgroundJobLog(
  jobId: number,
  data: {
    status: 'completed' | 'failed';
    success_count?: number;
    error_count?: number;
    error_message?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const supabase = getSupabase();
  const { data: result, error } = await supabase
    .from('background_job_logs')
    .update({
      ...data,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    console.error('Error updating background job log:', error);
    throw error;
  }

  return result;
}

/**
 * Get background job logs with pagination
 */
export async function getBackgroundJobLogs(filters?: {
  jobName?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = getSupabase();
  let query = supabase
    .from('background_job_logs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false });

  if (filters?.jobName) {
    query = query.eq('job_name', filters.jobName);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching background job logs:', error);
    throw error;
  }

  return { data: data || [], count };
}

/**
 * Get the latest job log for a specific job name
 */
export async function getLatestBackgroundJobLog(jobName: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('background_job_logs')
    .select('*')
    .eq('job_name', jobName)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest job log:', error);
  }

  return data || null;
}

/**
 * Get all unique emiten codes from stock_queries table
 */
export async function getUniqueEmitens(): Promise<string[]> {
  // Define the expected type for each row returned by the query
  type EmitenRow = { emiten: string };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stock_queries')
    .select('distinct emiten');

  if (error) {
    console.error('Error fetching unique emitens from Supabase:', error);
    throw error;
  }

  // Explicitly assert the type of 'data' to guide TypeScript
  // Use 'unknown' as an intermediate step to bypass strict type checking
  const typedEmitens = data as unknown as EmitenRow[] | null;

  console.log('Unique emitens fetched from Supabase:', typedEmitens);
  return typedEmitens?.map(item => item.emiten) || [];
}