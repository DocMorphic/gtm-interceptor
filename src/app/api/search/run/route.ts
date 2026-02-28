import { runPipeline } from "@/lib/pipeline/run";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // 5 min timeout for Vercel

export async function POST(request: NextRequest) {
  // Verify cron secret for automated calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow manual triggers from the dashboard (no auth) OR cron with secret
  if (authHeader && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPipeline();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Pipeline failed:", err);
    return NextResponse.json(
      { error: "Pipeline execution failed", message: String(err) },
      { status: 500 }
    );
  }
}
