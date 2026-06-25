import { NextRequest, NextResponse } from "next/server";

import { PipelineAlreadyRunningError, runPipeline } from "@/lib/pipeline";
import { isSupabaseAdminConfigured } from "@/lib/utils";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  const cronHeader = request.headers.get("x-vercel-cron");
  if (cronHeader === "1") {
    return authHeader === `Bearer ${secret}`;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  return Boolean(origin && host && origin.includes(host));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        success: false,
        started: false,
        message:
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY, then apply supabase/schema.sql."
      },
      { status: 503 }
    );
  }

  try {
    await runPipeline();
    return NextResponse.json({ success: true, started: true, message: "Pipeline completed successfully." });
  } catch (error: unknown) {
    if (error instanceof PipelineAlreadyRunningError) {
      return NextResponse.json({ success: true, started: false, alreadyRunning: true, message: error.message });
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, started: false, message }, { status: 500 });
  }
}
