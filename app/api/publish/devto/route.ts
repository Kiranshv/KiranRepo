import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { publishToDevto } from "@/lib/publisher";

const schema = z.object({
  runDateKey: z.string().optional(),
  published: z.boolean().optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = schema.parse(await request.json().catch(() => ({})));
    const result = await publishToDevto(body.runDateKey, body.published);
    return NextResponse.json({ success: result.success, result }, { status: result.success ? 200 : 500 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}