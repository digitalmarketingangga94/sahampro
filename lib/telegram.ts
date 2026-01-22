import { appendBackgroundJobLogEntry } from './supabase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(
  message: string, 
  jobLogId?: number, 
  jobName: string = 'telegram-alert'
) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    const errorMsg = 'Telegram bot token or chat ID is not configured.';
    console.error(errorMsg);
    if (jobLogId) {
      await appendBackgroundJobLogEntry(jobLogId, {
        level: 'error',
        message: errorMsg,
        details: { jobName }
      });
    }
    throw new Error(errorMsg);
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'MarkdownV2', // Use MarkdownV2 for rich formatting
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorData: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = await response.text(); // Read as text if not JSON
        console.error(`Telegram API returned non-JSON error: ${errorData.substring(0, 200)}...`);
      }
      
      const errorMsg = `Failed to send Telegram message: ${response.status} ${response.statusText} - ${typeof errorData === 'string' ? errorData : (errorData.description || JSON.stringify(errorData))}`;
      console.error(errorMsg);
      if (jobLogId) {
        await appendBackgroundJobLogEntry(jobLogId, {
          level: 'error',
          message: errorMsg,
          details: { jobName, telegramResponse: errorData }
        });
      }
      throw new Error(errorMsg);
    }

    const successData = await response.json();
    if (jobLogId) {
      await appendBackgroundJobLogEntry(jobLogId, {
        level: 'info',
        message: 'Telegram message sent successfully.',
        details: { jobName, telegramResponse: successData }
      });
    }
    return successData;
  } catch (error) {
    const errorMsg = `Error sending Telegram message: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    if (jobLogId) {
      await appendBackgroundJobLogEntry(jobLogId, {
        level: 'error',
        message: errorMsg,
        details: { jobName, originalError: error }
      });
    }
    throw error;
  }
}