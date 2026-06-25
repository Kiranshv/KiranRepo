"use client";

import { useEffect, useState } from "react";

import { ContentRow, ImageProviderName } from "@/lib/types";

interface ProviderStatus {
  configured: boolean;
  healthy: boolean;
  message: string;
}

interface ImageControlsProps {
  row: ContentRow | null;
  onRefresh: () => Promise<void>;
  imageStatus?: ImagesStatusResponse | null;
}

interface ImagesStatusResponse {
  defaultProvider: ImageProviderName;
  providers: {
    gemini: ProviderStatus;
    huggingface: ProviderStatus;
  };
}

function summarizeImageError(message: string): string {
  if (/quota|billing|resource_exhausted|rate limit/i.test(message)) {
    return "Image generation is blocked by provider quota or billing limits.";
  }

  if (/fetch failed|getaddrinfo|enotfound|network/i.test(message)) {
    return "Image generation failed because the provider could not be reached.";
  }

  if (/upload|storage/i.test(message)) {
    return "Image generation succeeded, but storing the image failed.";
  }

  return "Image generation failed. Open more info for the technical details.";
}

function ProviderMessage({ label, status }: { label: string; status: ProviderStatus }): JSX.Element {
  return (
    <div className="rounded-2xl border border-border/70 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
            status.configured
              ? status.healthy
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
              : "bg-red-500/15 text-red-300"
          }`}
        >
          {status.configured ? (status.healthy ? "Ready" : "Needs attention") : "Missing"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-300">{status.message}</p>
    </div>
  );
}

export function ImageControls({ row, onRefresh, imageStatus }: ImageControlsProps): JSX.Element {
  const [provider, setProvider] = useState<ImageProviderName>("huggingface");
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    void fetch("/api/images/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: ImagesStatusResponse) => {
        if (mounted) {
          setProvider(data.defaultProvider);
        }
      })
      .catch(() => {
        return;
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function run(endpoint: string, key: string, variants?: Array<"linkedin" | "medium" | "instagram">): Promise<void> {
    if (!row) {
      return;
    }

    setLoading(key);
    setFeedback("");
    try {
      const body = variants ? { runDateKey: row.runDateKey, variants, provider } : { runDateKey: row.runDateKey, provider };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = (await response.json()) as { success: boolean; message?: string };
      setFeedback(data.message || (data.success ? "Images generated." : "Image generation failed."));
      await onRefresh();
    } catch {
      setFeedback("Image generation request failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card/80 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Image Controls</h2>
          <p className="mt-1 text-sm text-muted">Choose a provider and generate images on demand.</p>
          {row?.imageProvider ? (
            <p className="mt-2 text-xs text-slate-300">Last provider: {row.imageProvider}</p>
          ) : null}
          {row?.imageError ? (
            <div className="mt-2 rounded-2xl border border-red-500/25 bg-red-500/5 p-3">
              <p className="text-xs font-medium text-red-300">{summarizeImageError(row.imageError)}</p>
              <details className="mt-2 text-xs text-slate-300">
                <summary className="cursor-pointer select-none text-slate-400 hover:text-slate-200">More info</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words font-sans leading-5 text-slate-300">{row.imageError}</pre>
              </details>
            </div>
          ) : null}
          {imageStatus ? (
            <p className="mt-2 text-xs text-slate-400">
              Default provider: <span className="font-medium text-slate-200">{imageStatus.defaultProvider}</span>
            </p>
          ) : null}
        </div>
        <label className="text-sm text-slate-200">
          Provider
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as ImageProviderName)}
            className="mt-2 block rounded-xl border border-border bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="gemini">Gemini</option>
            <option value="huggingface">Hugging Face</option>
          </select>
        </label>
      </div>

      {imageStatus ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ProviderMessage label="Gemini" status={imageStatus.providers.gemini} />
          <ProviderMessage label="Hugging Face" status={imageStatus.providers.huggingface} />
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            void run("/api/images/generate", "all", ["linkedin", "medium", "instagram"]);
          }}
          disabled={!row || loading !== null}
          className="rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          {loading === "all" ? "Generating..." : "Generate All Images"}
        </button>
        <button
          type="button"
          onClick={() => {
            void run("/api/images/generate/linkedin", "linkedin");
          }}
          disabled={!row || loading !== null}
          className="rounded-xl border border-border bg-slate-950 px-4 py-3 text-sm text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          {loading === "linkedin" ? "Generating..." : "Generate LinkedIn Image"}
        </button>
        <button
          type="button"
          onClick={() => {
            void run("/api/images/generate/medium", "medium");
          }}
          disabled={!row || loading !== null}
          className="rounded-xl border border-border bg-slate-950 px-4 py-3 text-sm text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          {loading === "medium" ? "Generating..." : "Generate Medium Image"}
        </button>
        <button
          type="button"
          onClick={() => {
            void run("/api/images/generate/instagram", "instagram");
          }}
          disabled={!row || loading !== null}
          className="rounded-xl border border-border bg-slate-950 px-4 py-3 text-sm text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
        >
          {loading === "instagram" ? "Generating..." : "Generate Instagram Image"}
        </button>
      </div>

      {feedback ? <p className="mt-3 text-sm text-cyan-300">{feedback}</p> : null}
    </section>
  );
}