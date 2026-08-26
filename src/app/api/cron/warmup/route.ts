import { NextResponse } from "next/server";

// Pinged every few minutes by .github/workflows/warmup.yml, separately
// from the weekly DB keepalive cron — that one exists to stop Supabase's
// free tier from auto-pausing over a long idle stretch, this one exists
// to stop Vercel's serverless function itself from going cold between
// requests during the day, which is what users were actually feeling as
// a multi-second delay reopening the app. No DB call and no auth here on
// purpose: the only job is to make Vercel invoke this function often
// enough that it stays warm, and there's nothing sensitive to protect.
export async function GET() {
  return NextResponse.json({ ok: true, warmed_at: new Date().toISOString() });
}
