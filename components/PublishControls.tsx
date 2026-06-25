"use client";

import { useState } from "react";

import { ContentRow } from "@/lib/types";

interface PublishControlsProps {
  row: ContentRow | null;
  onRefresh: () => Promise<void>;
}

export function PublishControls({ row, onRefresh }: PublishControlsProps): JSX.Element {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  async function run(endpoint: string, key: string, payload?: Record<string, unknown>): Promise<void> {
    if (!row) {
      return;
    }

    setLoading(key);
    setFeedback("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runDateKey: row.runDateKey, ...payload })
      });
      const data = (await response.json()) as { success: boolean; result?: { message?: string }; message?: string };
      setFeedback(data.result?.message || data.message || (data.success ? "Publish action completed." : "Publish action failed."));
      await onRefresh();
    } catch {
      setFeedback("Publish request failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card/80 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Publish Controls</h2>
          <p className="mt-1 text-sm text-muted">Publishing stays manual and updates Supabase publish metadata.</p>
        </div>
        <a
          href="/api/export"
          className="rounded-xl border border-border bg-slate-950 px-4 py-2 text-sm text-slate-100 hover:bg-slate-900"
        >
          Export XLSX
        </a>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            void run("/api/publish/linkedin", "linkedin");
          }}
          disabled={!row || loading !== null}
          className="rounded-xl bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          {loading === "linkedin" ? "Publishing..." : "Publish to LinkedIn"}
        </button>
        <button
          type="button"
          onClick={() => {
            void run("/api/publish/devto", "devto", { published: false });
          }}
          disabled={!row || loading !== null}
          className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          {loading === "devto" ? "Publishing..." : "Publish to Dev.to"}
        </button>
        <button
          type="button"
          onClick={() => {
            void run("/api/publish/all-supported", "all");
          }}
          disabled={!row || loading !== null}
          className="rounded-xl border border-border bg-slate-950 px-4 py-3 text-sm text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          {loading === "all" ? "Publishing..." : "Publish All Supported"}
        </button>
      </div>

      {row ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-slate-950/50 p-4 text-sm text-slate-300">
            <p className="font-semibold text-slate-100">LinkedIn</p>
            <p className="mt-2">Status: {row.linkedInPublishStatus}</p>
            <p className="mt-1 break-all">URL: {row.linkedInUrl || "-"}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-slate-950/50 p-4 text-sm text-slate-300">
            <p className="font-semibold text-slate-100">Dev.to</p>
            <p className="mt-2">Status: {row.devtoPublishStatus}</p>
            <p className="mt-1 break-all">URL: {row.devtoUrl || "-"}</p>
          </div>
        </div>
      ) : null}

      {feedback ? <p className="mt-3 text-sm text-cyan-300">{feedback}</p> : null}
    </section>
  );
}