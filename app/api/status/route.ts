import { NextResponse } from "next/server";

import { getRecentActivityLogs } from "@/lib/repositories/activityLogRepository";
import { getPipelineState } from "@/lib/repositories/pipelineRepository";
import { getDefaultImageProvider, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/utils";

const defaultPipelineState = {
  isRunning: false,
  currentStep: "idle",
  lastRunAt: null,
  lastError: null,
  currentTopic: null,
  nextScheduledRun: null
} as const;

export async function GET(): Promise<NextResponse> {
  try {
    const defaultProvider = getDefaultImageProvider();
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasHuggingFace = Boolean(process.env.HUGGINGFACE_API_KEY);
    const supabaseConfigured = isSupabaseConfigured();

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({
        ok: true,
        pipeline: defaultPipelineState,
        config: {
          groq: { configured: Boolean(process.env.GROQ_API_KEY) },
          supabase: { configured: supabaseConfigured }
        },
        images: {
          defaultProvider,
          providers: {
            gemini: {
              configured: hasGemini,
              healthy: hasGemini,
              message: hasGemini
                ? "Configured, but image quota/billing may still block generation."
                : "GEMINI_API_KEY is missing."
            },
            huggingface: {
              configured: hasHuggingFace,
              healthy: hasHuggingFace,
              message: hasHuggingFace ? "Ready" : "HUGGINGFACE_API_KEY is missing."
            }
          }
        },
        recentLogs: [],
        message:
          "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY, then run supabase/schema.sql."
      });
    }

    const state = await getPipelineState();
    const recentLogs = await getRecentActivityLogs(40);

    return NextResponse.json({
      ok: true,
      pipeline: state,
      config: {
        groq: { configured: Boolean(process.env.GROQ_API_KEY) },
        supabase: {
          configured: supabaseConfigured
        }
      },
      images: {
        defaultProvider,
        providers: {
          gemini: {
            configured: hasGemini,
            healthy: hasGemini,
            message: hasGemini
              ? "Configured, but image quota/billing may still block generation."
              : "GEMINI_API_KEY is missing."
          },
          huggingface: {
            configured: hasHuggingFace,
            healthy: hasHuggingFace,
            message: hasHuggingFace ? "Ready" : "HUGGINGFACE_API_KEY is missing."
          }
        }
      },
      recentLogs
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
