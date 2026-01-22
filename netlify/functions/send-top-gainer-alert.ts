import type { Config } from "@netlify/functions";
import { fetchMarketMovers } from '../../lib/stockbit';
import { sendTelegramMessage } from '../../lib/telegram';
import { 
  createBackgroundJobLog, 
  appendBackgroundJobLogEntry, 
  updateBackgroundJobLog 
} from '../../lib/supabase';

export default async (req: Request) => {
  const startTime = Date.now();
  let jobLogId: number | null = null;
  const jobName = 'send-top-gainer-alert';

  console.log(`[${jobName}] Starting job...`);

  try {
    // Create job log entry
    try {
      const jobLog = await createBackgroundJobLog(jobName, 1); // 1 item to process (the alert itself)
      const currentJobId = jobLog.id; // Use a local variable here
      jobLogId = currentJobId; // Assign to the outer variable for later use
      console.log(`[${jobName}] Created job log with ID: ${jobLogId}`);
      await appendBackgroundJobLogEntry(currentJobId, { // Pass the local variable which is definitely a number
        level: 'info',
        message: 'Fetching top gainers...',
        details: { jobName }
      });
    } catch (logError) {
      console.error(`[${jobName}] Failed to create job log, continuing without logging:`, logError);
    }

    const topGainers = await fetchMarketMovers('gainer', 10); // Fetch top 10 gainers

    if (topGainers.length === 0) {
      const message = 'Tidak ada top gainer yang ditemukan hari ini.';
      await sendTelegramMessage(message, jobLogId ?? undefined, jobName); // Fix: Use ?? undefined
      if (jobLogId) {
        await updateBackgroundJobLog(jobLogId, {
          status: 'completed',
          success_count: 1,
          metadata: { message: 'No top gainers found' }
        });
      }
      return new Response(JSON.stringify({ success: true, message: 'No top gainers' }), { status: 200 });
    }

    let telegramMessage = `📈 *Top 10 Gainer Hari Ini* 📈\n\n`;
    topGainers.forEach((item, index) => {
      const changePercentage = item.change_percentage >= 0 ? `+${item.change_percentage.toFixed(2)}%` : `${item.change_percentage.toFixed(2)}%`;
      const price = item.last_price.toLocaleString('id-ID');
      telegramMessage += `*${index + 1}\\. ${item.symbol}* \\- Rp${price} \\(${changePercentage}\\)\n`;
    });
    telegramMessage += `\n_Data dari Stockbit_`;

    // Escape special characters for MarkdownV2
    const escapedMessage = telegramMessage.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');

    await sendTelegramMessage(escapedMessage, jobLogId ?? undefined, jobName); // Fix: Use ?? undefined

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[${jobName}] Job completed in ${duration}s. Alert sent.`);

    if (jobLogId) {
      await updateBackgroundJobLog(jobLogId, {
        status: 'completed',
        success_count: 1,
        metadata: { 
          duration_seconds: duration,
          top_gainers_count: topGainers.length,
        },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Top gainer alert sent' }), { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${jobName}] Critical error:`, error);

    if (jobLogId) {
      await appendBackgroundJobLogEntry(jobLogId, {
        level: 'error',
        message: `Job failed: ${errorMessage}`,
        details: { originalError: errorMessage }
      });
      await updateBackgroundJobLog(jobLogId, {
        status: 'failed',
        error_message: errorMessage,
        metadata: { duration_seconds: (Date.now() - startTime) / 1000 }
      });
    }

    // Attempt to send a failure message to Telegram if the error is not related to Telegram itself
    if (!errorMessage.includes('Telegram bot token') && !errorMessage.includes('Failed to send Telegram message')) {
      try {
        const failureMessage = `❌ *Alert Gagal* ❌\n\nTerjadi kesalahan saat mengambil atau mengirim data top gainer: \`${errorMessage}\``;
        await sendTelegramMessage(failureMessage.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1'), jobLogId ?? undefined, jobName); // Fix: Use ?? undefined
      } catch (telegramError) {
        console.error(`[${jobName}] Failed to send failure message to Telegram:`, telegramError);
      }
    }

    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500 });
  }
};

export const config: Config = {
  schedule: "0 9 * * 1-5" // Every weekday (Mon-Fri) at 09:00 UTC (16:00 WIB)
};