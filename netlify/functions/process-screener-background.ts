import { 
  fetchStockScreener 
} from '../../lib/stockbit';
import { 
  createBackgroundJobLog, 
  appendBackgroundJobLogEntry, 
  updateBackgroundJobLog,
  saveDailyScreenerResult
} from '../../lib/supabase';

export default async (req: Request) => {
  const startTime = Date.now();
  let jobLogId: number | null = null;
  const url = new URL(req.url);
  const templateId = url.searchParams.get('templateId');

  console.log('[Screener Background] Starting screener processing job...');

  try {
    if (!templateId) {
      return new Response(JSON.stringify({ error: 'Missing templateId parameter' }), { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Create job log entry
    try {
      const jobLog = await createBackgroundJobLog(`screener-${templateId}`, 0);
      if (jobLog) { // Pastikan jobLog tidak null sebelum mengakses propertinya
        jobLogId = jobLog.id;
        await appendBackgroundJobLogEntry(jobLogId!, { // <-- Perbaikan di sini: tambahkan '!'
          level: 'info',
          message: `Starting screener analysis for template ${templateId}`,
        });
      }
    } catch (logError) {
      console.error('[Screener Background] Failed to create job log, continuing without logging:', logError);
    }

    let successCount = 0;
    let errorCount = 0;
    let totalItems = 0;

    // Fetch screener data (fetch all pages if necessary, or just the first few)
    // For simplicity, let's fetch up to 5 pages (125 items) for now.
    // The Stockbit API for screener templates returns `totalrows` and `perpage`.
    // We need to loop through pages to get all data.
    const allScreenerCalcs = [];
    let currentPage = 1;
    let hasMore = true;
    const maxPagesToFetch = 5; // Limit to avoid excessive API calls if screener is very large

    while (hasMore && currentPage <= maxPagesToFetch) {
      if (jobLogId) {
        await appendBackgroundJobLogEntry(jobLogId, {
          level: 'info',
          message: `Fetching screener data, page ${currentPage}...`,
          details: { page: currentPage }
        });
      }

      const screenerResponse = await fetchStockScreener(templateId, currentPage, 25); // Fetch 25 items per page
      if (screenerResponse.data?.calcs) {
        allScreenerCalcs.push(...screenerResponse.data.calcs);
        totalItems = screenerResponse.data.totalrows; // Update total items from the first response
        hasMore = (currentPage * screenerResponse.data.perpage) < screenerResponse.data.totalrows;
        currentPage++;
      } else {
        hasMore = false; // No more data or error
      }
    }

    if (jobLogId) {
      await updateBackgroundJobLog(jobLogId, { total_items: totalItems, status: 'running' });
      await appendBackgroundJobLogEntry(jobLogId, {
        level: 'info',
        message: `Fetched ${allScreenerCalcs.length} items from screener.`,
        details: { total_items_fetched: allScreenerCalcs.length, total_rows_available: totalItems }
      });
    }

    // Save each screener result to the database
    for (const item of allScreenerCalcs) {
      try {
        await saveDailyScreenerResult({
          template_id: templateId,
          emiten: item.company.symbol,
          company_name: item.company.name,
          screener_data: item.results, // Store the results array for this company
          snapshot_date: today,
          status: 'success',
        });
        successCount++;
        if (jobLogId) {
          await appendBackgroundJobLogEntry(jobLogId, {
            level: 'info',
            message: `Saved screener result for ${item.company.symbol}`,
            emiten: item.company.symbol,
          });
        }
      } catch (saveError) {
        errorCount++;
        const errorMessage = saveError instanceof Error ? saveError.message : String(saveError);
        console.error(`[Screener Background] Error saving screener result for ${item.company.symbol}:`, saveError);
        if (jobLogId) {
          await appendBackgroundJobLogEntry(jobLogId, {
            level: 'error',
            message: `Failed to save screener result: ${errorMessage}`,
            emiten: item.company.symbol,
          });
        }
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[Screener Background] Job completed in ${duration}s. Success: ${successCount}, Errors: ${errorCount}`);

    // Update job log with final status
    if (jobLogId) {
      const hasErrors = errorCount > 0;
      await updateBackgroundJobLog(jobLogId, {
        status: hasErrors && successCount === 0 ? 'failed' : 'completed',
        success_count: successCount,
        error_count: errorCount,
        error_message: hasErrors ? `${errorCount} items failed` : undefined,
        metadata: { 
          duration_seconds: duration,
          date: today,
          template_id: templateId,
        },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results: successCount, 
      errors: errorCount,
      jobLogId,
    }), { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Screener Background] Critical error:', error);

    if (jobLogId) {
      await appendBackgroundJobLogEntry(jobLogId, {
        level: 'error',
        message: `Critical job failure: ${errorMessage}`,
      });
      await updateBackgroundJobLog(jobLogId, {
        status: 'failed',
        error_message: errorMessage,
        metadata: { 
          duration_seconds: (Date.now() - startTime) / 1000,
          template_id: templateId,
        },
      });
    } else {
      // Fallback if job log couldn't be created initially
      try {
        const failedLog = await createBackgroundJobLog(`screener-${templateId}`, 0);
        await updateBackgroundJobLog(failedLog.id, {
          status: 'failed',
          error_message: errorMessage,
          metadata: { template_id: templateId },
        });
      } catch (logError) {
        console.error('[Screener Background] Failed to log critical error (fallback):', logError);
      }
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
    }), { status: 500 });
  }
};