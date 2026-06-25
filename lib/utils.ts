import { ImageProviderName, ImageVariant } from "@/lib/types";

const devtoTagStopWords = new Set([
  "and",
  "the",
  "with",
  "from",
  "into",
  "that",
  "your",
  "about"
]);

export function getTodayDateString(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

export function getTodayRunDateKey(date: Date = new Date()): string {
  return getTodayDateString(date);
}

export function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export function isValidImageProvider(value: string): value is ImageProviderName {
  return value === "gemini" || value === "huggingface";
}

export function getDefaultImageProvider(): ImageProviderName {
  const configured = process.env.IMAGE_PROVIDER?.trim().toLowerCase();
  return configured && isValidImageProvider(configured) ? configured : "huggingface";
}

export function buildImageStoragePath(params: {
  runDateKey: string;
  topicSlug: string;
  variant: ImageVariant;
}): string {
  return `${params.runDateKey}/${params.topicSlug}/${params.variant}.png`;
}

export function inferDevtoTagsFromTopic(topic: string): string[] {
  const words = topic
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !devtoTagStopWords.has(word));

  const tags = Array.from(new Set(["ai", "automation", ...words])).slice(0, 4);
  return tags.length > 0 ? tags : ["ai", "automation"];
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
