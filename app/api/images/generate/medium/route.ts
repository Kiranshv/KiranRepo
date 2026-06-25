import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateMediumImageForRow } from "@/lib/imageGenerator";

const schema = z.object({
  runDateKey: z.string().min(1),
  provider: z.enum(["gemini", "huggingface"]).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = schema.parse(await request.json());
    await generateMediumImageForRow(body.runDateKey, body.provider);
    return NextResponse.json({ success: true, message: "Medium image generated." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}