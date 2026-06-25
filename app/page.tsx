"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ContentTabs } from "@/components/ContentTabs";
import { StatusCards } from "@/components/StatusCards";
import { ActivityLogEntry, ContentRow, PipelineState } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface StatusResponse {
  ok: boolean;
  pipeline: PipelineState;
  config: {
    groq: { configured: boolean };
    supabase: { configured: boolean };
  };
  images: {
    defaultProvider: "gemini" | "huggingface";
    providers: {
      gemini: { configured: boolean; healthy: boolean; message: string };
      huggingface: { configured: boolean; healthy: boolean; message: string };
    };
  };
  recentLogs: ActivityLogEntry[];
  message?: string;
}

interface TodayResponse {
  ok: boolean;
  row: ContentRow | null;
  message?: string;
}

interface CalendarResponse {
  ok: boolean;
  rows: ContentRow[];
  message?: string;
}

const defaultPipelineState: PipelineState = {
  isRunning: false,
  currentStep: "idle",
  lastRunAt: null,
  lastError: null,
  currentTopic: null,
  nextScheduledRun: null
};

function KeyPill({ label, ok }: { label: string; ok: boolean }): JSX.Element {
  const state = ok ? "ready" : "missing";

  return <KeyPillWithState label={label} state={state} />;
}

function KeyPillWithState({
  label,
  state
}: {
  label: string;
  state: "ready" | "missing" | "warning";
}): JSX.Element {
  const styles =
    state === "ready"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : state === "warning"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-red-500/40 bg-red-500/10 text-red-300";

  const dotStyles =
    state === "ready" ? "bg-emerald-400" : state === "warning" ? "bg-amber-400" : "bg-red-400";

  const text = state === "ready" ? "Ready" : state === "warning" ? "Limited" : "Missing";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${styles}`}>
      <span className={`h-2 w-2 rounded-full ${dotStyles}`} />
      {label}: {text}
    </span>
  );
}

export default function Page(): JSX.Element {
  const [pipelineState, setPipelineState] = useState<PipelineState>(defaultPipelineState);
  const [todayRow, setTodayRow] = useState<ContentRow | null>(null);
  const [calendarRows, setCalendarRows] = useState<ContentRow[]>([]);
  const [hasGroqKey, setHasGroqKey] = useState(false);
  const [hasSupabase, setHasSupabase] = useState(false);
  const [imageStatus, setImageStatus] = useState<StatusResponse["images"] | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLogEntry[]>([]);
  const [runBusy, setRunBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  const fetchStatus = useCallback(async (): Promise<void> => {
    const res = await fetch("/api/status", { cache: "no-store" });
    const data = (await res.json()) as StatusResponse;
    if (data.ok) {
      setPipelineState(data.pipeline);
      setHasGroqKey(data.config.groq.configured);
      setHasSupabase(data.config.supabase.configured);
      setImageStatus(data.images);
      setRecentLogs(data.recentLogs ?? []);
    }
  }, []);

  const fetchToday = useCallback(async (): Promise<void> => {
    const res = await fetch("/api/today", { cache: "no-store" });
    const data = (await res.json()) as TodayResponse;
    if (data.ok) {
      setTodayRow(data.row);
    }
  }, []);

  const fetchCalendar = useCallback(async (): Promise<void> => {
    const res = await fetch("/api/calendar", { cache: "no-store" });
    const data = (await res.json()) as CalendarResponse;
    if (data.ok) {
      setCalendarRows(data.rows ?? []);
    }
  }, []);

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([fetchStatus(), fetchToday(), fetchCalendar()]);
  }, [fetchCalendar, fetchStatus, fetchToday]);

  useEffect(() => {
    void refreshAll();

    const statusTimer = setInterval(() => {
      void fetchStatus();
      void fetchToday();
    }, 5000);

    const calendarTimer = setInterval(() => {
      void fetchCalendar();
    }, 10000);

    return () => {
      clearInterval(statusTimer);
      clearInterval(calendarTimer);
    };
  }, [fetchCalendar, fetchStatus, fetchToday, refreshAll]);

  const onRun = useCallback(async () => {
    setRunBusy(true);
    setFeedback("");
    try {
      const res = await fetch("/api/run", { method: "POST" });
      const body = (await res.json()) as { success: boolean; message: string };
      setFeedback(body.message || (body.success ? "Pipeline completed" : "Pipeline failed"));
      await refreshAll();
    } catch {
      setFeedback("Failed to call /api/run");
    } finally {
      setRunBusy(false);
    }
  }, [refreshAll]);

  const nextRun = useMemo(() => formatDateTime(pipelineState.nextScheduledRun), [pipelineState.nextScheduledRun]);
  const geminiState = useMemo<"ready" | "missing" | "warning">(() => {
    const provider = imageStatus?.providers.gemini;
    if (!provider?.configured) {
      return "missing";
    }

    if (/quota|billing|rate limit|resource_exhausted/i.test(provider.message)) {
      return "warning";
    }

    return provider.healthy ? "ready" : "warning";
  }, [imageStatus]);

  const huggingFaceState = useMemo<"ready" | "missing" | "warning">(() => {
    const provider = imageStatus?.providers.huggingface;
    if (!provider?.configured) {
      return "missing";
    }

    return provider.healthy ? "ready" : "warning";
  }, [imageStatus]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <header className="overflow-hidden rounded-[2rem] border border-border bg-card/90 p-6 shadow-[0_30px_120px_rgba(5,12,24,0.55)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Vercel-hostable content system</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">ContentForge</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Groq generates topics and content. Supabase stores rows, logs, and image assets. Images stay manual and can use Gemini or Hugging Face.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <KeyPill label="Groq" ok={hasGroqKey} />
            <KeyPill label="Supabase" ok={hasSupabase} />
            <KeyPillWithState label="Gemini" state={geminiState} />
            <KeyPillWithState label="Hugging Face" state={huggingFaceState} />
            <span className="rounded-full border border-border bg-slate-900 px-3 py-1 text-xs text-slate-300">
              Next Run: <span className="font-mono">{nextRun}</span>
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                pipelineState.isRunning
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {pipelineState.isRunning ? "Pipeline Running" : "Pipeline Idle"}
            </span>
            <button
              type="button"
              onClick={() => {
                void onRun();
              }}
              disabled={runBusy || pipelineState.isRunning}
              className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {runBusy ? "Running..." : "Run Pipeline Now"}
            </button>
          </div>
        </div>
        {feedback ? <p className="mt-3 text-sm text-cyan-300">{feedback}</p> : null}
      </header>

      <StatusCards todayRow={todayRow} pipelineState={pipelineState} />

      <ContentTabs
        todayRow={todayRow}
        calendarRows={calendarRows}
        recentLogs={recentLogs}
        onRefresh={refreshAll}
        imageStatus={imageStatus}
      />
    </main>
  );
}
