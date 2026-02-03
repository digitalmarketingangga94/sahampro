import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  try {
    const baseUrl = process.env.NETLIFY_FUNCTION_URL || process.env.URL || 'http://localhost:3000';
    const templateId = "5942071"; // Hardcoded template ID for "Daily Net Foreign Flow ISSI"

    console.log(`[Screener Scheduler] Triggering background job for template ${templateId} at ${baseUrl}/.netlify/functions/process-screener-background`);

    // Trigger background function - this returns 202 immediately
    const response = await fetch(`${baseUrl}/.netlify/functions/process-screener-background?templateId=${templateId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`[Screener Scheduler] Background job triggered, status: ${response.status}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Background screener job triggered',
      status: response.status
    }), { status: 200 });
  } catch (error) {
    console.error('[Screener Scheduler] Netlify function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
};

export const config: Config = {
  schedule: "0 11 * * *" // Runs daily at 11:00 UTC
};