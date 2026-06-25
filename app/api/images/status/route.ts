import { NextResponse } from "next/server";

import { getDefaultImageProvider } from "@/lib/utils";

export async function GET(): Promise<NextResponse> {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasHuggingFace = Boolean(process.env.HUGGINGFACE_API_KEY);

  return NextResponse.json({
    defaultProvider: getDefaultImageProvider(),
    providers: {
      gemini: {
        configured: hasGemini,
        healthy: hasGemini,
        message: hasGemini ? "Configured, but billing/quota may not be enabled." : "GEMINI_API_KEY is missing."
      },
      huggingface: {
        configured: hasHuggingFace,
        healthy: hasHuggingFace,
        message: hasHuggingFace ? "Ready" : "HUGGINGFACE_API_KEY is missing."
      }
    }
  });
}