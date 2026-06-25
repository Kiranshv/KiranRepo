import { NextResponse } from "next/server";

import { getAllContentRows } from "@/lib/repositories/contentRepository";
import { isSupabaseAdminConfigured } from "@/lib/utils";

export async function GET(): Promise<NextResponse> {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        ok: true,
        rows: [],
        message: "Supabase is not configured yet."
      });
    }

    const rows = await getAllContentRows();
    return NextResponse.json({ ok: true, rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
