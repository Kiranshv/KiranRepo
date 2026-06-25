import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateImagesForRow } from "@/lib/imageGenerator";
import { GenerateImagesRequest } from "@/lib/types";

const schema = z.object({
  runDateKey: z.string().min(1),
  variants: z.array(z.enum(["linkedin", "medium", "instagram"])) .min(1),
  provider: z.enum(["gemini", "huggingface"]).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const json = (await request.json()) as GenerateImagesRequest;
    const body = schema.parse(json);
    await generateImagesForRow(body);
    return NextResponse.json({ success: true, message: "Images generated successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}