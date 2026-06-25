"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import { ActivityLog } from "@/components/ActivityLog";
import { CalendarTable } from "@/components/CalendarTable";
import { ImageControls } from "@/components/ImageControls";
import { PublishControls } from "@/components/PublishControls";
import { ActivityLogEntry, ContentRow } from "@/lib/types";

interface ImageStatusPayload {
  defaultProvider: "gemini" | "huggingface";
  providers: {
    gemini: { configured: boolean; healthy: boolean; message: string };
    huggingface: { configured: boolean; healthy: boolean; message: string };
  };
}

interface ContentTabsProps {
  todayRow: ContentRow | null;
  calendarRows: ContentRow[];
  recentLogs: ActivityLogEntry[];
  onRefresh: () => Promise<void>;
  imageStatus: ImageStatusPayload | null;
}

type TabKey = "today" | "calendar" | "activity";

type GeneratedImageCard = {
  label: string;
  variant: "linkedin" | "medium" | "instagram";
  src: string;
};

function withCacheBuster(src: string, cacheKey: string): string {
  if (!src) {
    return "";
  }

  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${encodeURIComponent(cacheKey)}`;
}

function triggerDownload(url: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function CopyButton({ value }: { value: string }): JSX.Element {
  const [copied, setCopied] = useState(false);

  async function onCopy(): Promise<void> {
    if (!value) {
      return;
    }
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={() => {
        void onCopy();
      }}
      className="rounded-md border border-border bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function TextPanel({ title, body, markdown = false }: { title: string; body: string; markdown?: boolean }): JSX.Element {
  return (
    <details className="rounded-xl border border-border bg-card p-4" open>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-100">
        <span>{title}</span>
        <CopyButton value={body} />
      </summary>
      <div className="mt-3 text-sm leading-7 text-slate-200">
        {body ? (
          markdown ? (
            <article className="prose prose-invert max-w-none prose-pre:bg-slate-900">
              <ReactMarkdown>{body}</ReactMarkdown>
            </article>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7">{body}</pre>
          )
        ) : (
          <p className="text-muted">No content generated yet.</p>
        )}
      </div>
    </details>
  );
}

export function ContentTabs({
  todayRow,
  calendarRows,
  recentLogs,
  onRefresh,
  imageStatus
}: ContentTabsProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>("today");

  const imageCacheKey = useMemo(() => {
    return todayRow?.imageGeneratedAt || todayRow?.updatedAt || todayRow?.runDateKey || "init";
  }, [todayRow?.imageGeneratedAt, todayRow?.runDateKey, todayRow?.updatedAt]);

  const generatedImages = useMemo<GeneratedImageCard[]>(() => {
    return [
      { label: "LinkedIn Image", variant: "linkedin", src: todayRow?.linkedInImageUrl ?? "" },
      { label: "Medium Image", variant: "medium", src: todayRow?.mediumImageUrl ?? "" },
      { label: "IG Image", variant: "instagram", src: todayRow?.igImageUrl ?? "" }
    ];
  }, [todayRow?.igImageUrl, todayRow?.linkedInImageUrl, todayRow?.mediumImageUrl]);

  const tabs = useMemo(
    () => [
      { key: "today" as const, label: "Today's Content" },
      { key: "calendar" as const, label: "Calendar" },
      { key: "activity" as const, label: "Activity Log" }
    ],
    []
  );

  return (
    <section className="rounded-xl border border-border bg-slate-950/60 p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              activeTab === tab.key
                ? "bg-accent/20 text-accent"
                : "border border-border bg-card text-slate-300 hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "today" && (
        <div className="space-y-4">
          <ImageControls row={todayRow} onRefresh={onRefresh} imageStatus={imageStatus} />
          <PublishControls row={todayRow} onRefresh={onRefresh} />

          <TextPanel title="LinkedIn" body={todayRow?.linkedInPost ?? ""} />
          <TextPanel title="Medium" body={todayRow?.mediumArticle ?? ""} markdown />
          <TextPanel title="Instagram" body={todayRow?.igScript ?? ""} />
          <TextPanel title="YouTube" body={todayRow?.ytScript ?? ""} />
          <TextPanel title="Dev.to" body={todayRow?.devtoArticle ?? ""} markdown />

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-slate-100">Generated Images</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
              {generatedImages.map((item) => (
                <div key={item.label} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted">{item.label}</p>
                    {item.src && todayRow?.runDateKey ? (
                      <button
                        type="button"
                        onClick={() => {
                          const fileName = `${todayRow.runDateKey}-${item.variant}.png`;
                          const downloadUrl = `/api/images/download?runDateKey=${encodeURIComponent(todayRow.runDateKey)}&variant=${item.variant}`;
                          triggerDownload(downloadUrl, fileName);
                        }}
                        className="rounded-md border border-border bg-slate-900 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                      >
                        Download
                      </button>
                    ) : null}
                  </div>
                  {item.src ? (
                    <div className="relative h-44 w-full overflow-hidden rounded-md">
                      <Image
                        key={`${item.variant}-${imageCacheKey}`}
                        src={withCacheBuster(item.src, imageCacheKey)}
                        alt={item.label}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted">
                      Not generated yet
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "calendar" && <CalendarTable rows={calendarRows} />}

      {activeTab === "activity" && <ActivityLog logs={recentLogs} />}
    </section>
  );
}
