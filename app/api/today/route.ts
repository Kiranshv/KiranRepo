import { NextResponse } from "next/server";

import { getContentRowByRunDateKey } from "@/lib/repositories/contentRepository";
import { getTodayRunDateKey, isSupabaseAdminConfigured } from "@/lib/utils";

export async function GET(): Promise<NextResponse> {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        ok: true,
        row: null,
        message: "Supabase is not configured yet."
      });
    }

    const row = await getContentRowByRunDateKey(getTodayRunDateKey());
    return NextResponse.json({ ok: true, row: row ?? null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
