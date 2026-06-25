import { randomUUID } from "crypto";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { AgentName, ContentRow, ContentStatus, PublishStatus } from "@/lib/types";
import { getTodayDateString, getTodayRunDateKey } from "@/lib/utils";

interface ContentRowRecord {
  id: string;
  date: string;
  run_date_key: string;
  topic: string;
  linkedin_post: string;
  medium_article: string;
  ig_script: string;
  yt_script: string;
  devto_article: string;
  status: ContentStatus;
  linkedin_image_url: string;
  medium_image_url: string;
  ig_image_url: string;
  created_at: string;
  updated_at: string;
  last_agent: AgentName;
  error_message: string;
  linkedin_publish_status: PublishStatus;
  linkedin_post_id: string;
  linkedin_url: string;
  linkedin_published_at: string | null;
  devto_publish_status: PublishStatus;
  devto_article_id: string;
  devto_url: string;
  devto_published_at: string | null;
  publish_errors: string;
  image_provider: string;
  image_generated_at: string | null;
  image_error: string;
}

const baseRowDefaults = (): Omit<ContentRowRecord, "id" | "date" | "run_date_key" | "created_at" | "updated_at"> => ({
  topic: "",
  linkedin_post: "",
  medium_article: "",
  ig_script: "",
  yt_script: "",
  devto_article: "",
  status: "Pending",
  linkedin_image_url: "",
  medium_image_url: "",
  ig_image_url: "",
  last_agent: "System",
  error_message: "",
  linkedin_publish_status: "Not Started",
  linkedin_post_id: "",
  linkedin_url: "",
  linkedin_published_at: null,
  devto_publish_status: "Not Started",
  devto_article_id: "",
  devto_url: "",
  devto_published_at: null,
  publish_errors: "",
  image_provider: "",
  image_generated_at: null,
  image_error: ""
});

function mapContentRow(record: ContentRowRecord): ContentRow {
  return {
    id: record.id,
    date: record.date,
    runDateKey: record.run_date_key,
    topic: record.topic,
    linkedInPost: record.linkedin_post,
    mediumArticle: record.medium_article,
    igScript: record.ig_script,
    ytScript: record.yt_script,
    devtoArticle: record.devto_article,
    status: record.status,
    linkedInImageUrl: record.linkedin_image_url,
    mediumImageUrl: record.medium_image_url,
    igImageUrl: record.ig_image_url,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    lastAgent: record.last_agent,
    errorMessage: record.error_message,
    linkedInPublishStatus: record.linkedin_publish_status,
    linkedInPostId: record.linkedin_post_id,
    linkedInUrl: record.linkedin_url,
    linkedInPublishedAt: record.linkedin_published_at,
    devtoPublishStatus: record.devto_publish_status,
    devtoArticleId: record.devto_article_id,
    devtoUrl: record.devto_url,
    devtoPublishedAt: record.devto_published_at,
    publishErrors: record.publish_errors,
    imageProvider: record.image_provider,
    imageGeneratedAt: record.image_generated_at,
    imageError: record.image_error
  };
}

function mapPatchToRecord(patch: Partial<ContentRow>): Partial<ContentRowRecord> {
  const next: Partial<ContentRowRecord> = {};

  if (patch.id !== undefined) next.id = patch.id;
  if (patch.date !== undefined) next.date = patch.date;
  if (patch.runDateKey !== undefined) next.run_date_key = patch.runDateKey;
  if (patch.topic !== undefined) next.topic = patch.topic;
  if (patch.linkedInPost !== undefined) next.linkedin_post = patch.linkedInPost;
  if (patch.mediumArticle !== undefined) next.medium_article = patch.mediumArticle;
  if (patch.igScript !== undefined) next.ig_script = patch.igScript;
  if (patch.ytScript !== undefined) next.yt_script = patch.ytScript;
  if (patch.devtoArticle !== undefined) next.devto_article = patch.devtoArticle;
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.linkedInImageUrl !== undefined) next.linkedin_image_url = patch.linkedInImageUrl;
  if (patch.mediumImageUrl !== undefined) next.medium_image_url = patch.mediumImageUrl;
  if (patch.igImageUrl !== undefined) next.ig_image_url = patch.igImageUrl;
  if (patch.createdAt !== undefined) next.created_at = patch.createdAt;
  if (patch.updatedAt !== undefined) next.updated_at = patch.updatedAt;
  if (patch.lastAgent !== undefined) next.last_agent = patch.lastAgent;
  if (patch.errorMessage !== undefined) next.error_message = patch.errorMessage;
  if (patch.linkedInPublishStatus !== undefined) next.linkedin_publish_status = patch.linkedInPublishStatus;
  if (patch.linkedInPostId !== undefined) next.linkedin_post_id = patch.linkedInPostId;
  if (patch.linkedInUrl !== undefined) next.linkedin_url = patch.linkedInUrl;
  if (patch.linkedInPublishedAt !== undefined) next.linkedin_published_at = patch.linkedInPublishedAt;
  if (patch.devtoPublishStatus !== undefined) next.devto_publish_status = patch.devtoPublishStatus;
  if (patch.devtoArticleId !== undefined) next.devto_article_id = patch.devtoArticleId;
  if (patch.devtoUrl !== undefined) next.devto_url = patch.devtoUrl;
  if (patch.devtoPublishedAt !== undefined) next.devto_published_at = patch.devtoPublishedAt;
  if (patch.publishErrors !== undefined) next.publish_errors = patch.publishErrors;
  if (patch.imageProvider !== undefined) next.image_provider = patch.imageProvider;
  if (patch.imageGeneratedAt !== undefined) next.image_generated_at = patch.imageGeneratedAt;
  if (patch.imageError !== undefined) next.image_error = patch.imageError;

  return next;
}

async function requireSingleRow(runDateKey: string): Promise<ContentRow> {
  const row = await getContentRowByRunDateKey(runDateKey);
  if (!row) {
    throw new Error(`Content row ${runDateKey} was not found.`);
  }
  return row;
}

export async function getAllContentRows(): Promise<ContentRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("content_rows")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load content rows: ${error.message}`);
  }

  return (data ?? []).map((record) => mapContentRow(record as ContentRowRecord));
}

export async function getContentRowByRunDateKey(runDateKey: string): Promise<ContentRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("content_rows")
    .select("*")
    .eq("run_date_key", runDateKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load content row ${runDateKey}: ${error.message}`);
  }

  return data ? mapContentRow(data as ContentRowRecord) : null;
}

export async function createContentRow(input: Partial<ContentRow>): Promise<ContentRow> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const runDateKey = input.runDateKey ?? getTodayRunDateKey();
  const payload: ContentRowRecord = {
    id: input.id ?? randomUUID(),
    date: input.date ?? getTodayDateString(),
    run_date_key: runDateKey,
    created_at: input.createdAt ?? now,
    updated_at: input.updatedAt ?? now,
    ...baseRowDefaults(),
    ...mapPatchToRecord(input)
  } as ContentRowRecord;

  const { data, error } = await supabase.from("content_rows").insert(payload).select("*").single();

  if (error) {
    throw new Error(`Failed to create content row: ${error.message}`);
  }

  return mapContentRow(data as ContentRowRecord);
}

export async function updateContentRowByRunDateKey(
  runDateKey: string,
  patch: Partial<ContentRow>
): Promise<ContentRow> {
  const supabase = getSupabaseAdminClient();
  const payload = {
    ...mapPatchToRecord(patch),
    updated_at: patch.updatedAt ?? new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("content_rows")
    .update(payload)
    .eq("run_date_key", runDateKey)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update content row ${runDateKey}: ${error.message}`);
  }

  return mapContentRow(data as ContentRowRecord);
}

export async function upsertTodayRow(input: Partial<ContentRow>): Promise<ContentRow> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const runDateKey = input.runDateKey ?? getTodayRunDateKey();
  const payload = {
    id: input.id ?? randomUUID(),
    date: input.date ?? getTodayDateString(),
    run_date_key: runDateKey,
    created_at: input.createdAt ?? now,
    updated_at: input.updatedAt ?? now,
    ...baseRowDefaults(),
    ...mapPatchToRecord(input)
  };

  const { data, error } = await supabase
    .from("content_rows")
    .upsert(payload, { onConflict: "run_date_key" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert content row ${runDateKey}: ${error.message}`);
  }

  return mapContentRow(data as ContentRowRecord);
}

export async function setContentStatus(
  runDateKey: string,
  status: ContentStatus,
  lastAgent: AgentName
): Promise<void> {
  await updateContentRowByRunDateKey(runDateKey, {
    status,
    lastAgent,
    updatedAt: new Date().toISOString()
  });
}

export async function updateImageFields(
  runDateKey: string,
  patch: {
    linkedInImageUrl?: string;
    mediumImageUrl?: string;
    igImageUrl?: string;
    imageProvider?: string;
    imageGeneratedAt?: string | null;
    imageError?: string;
  }
): Promise<void> {
  await updateContentRowByRunDateKey(runDateKey, {
    linkedInImageUrl: patch.linkedInImageUrl,
    mediumImageUrl: patch.mediumImageUrl,
    igImageUrl: patch.igImageUrl,
    imageProvider: patch.imageProvider,
    imageGeneratedAt: patch.imageGeneratedAt,
    imageError: patch.imageError,
    updatedAt: new Date().toISOString()
  });
}

export async function appendContentError(runDateKey: string, message: string): Promise<void> {
  const row = await requireSingleRow(runDateKey);
  const errorMessage = row.errorMessage.trim() ? `${row.errorMessage}\n${message}` : message;
  await updateContentRowByRunDateKey(runDateKey, {
    errorMessage,
    updatedAt: new Date().toISOString()
  });
}

export async function updatePublishFields(runDateKey: string, patch: Partial<ContentRow>): Promise<ContentRow> {
  return updateContentRowByRunDateKey(runDateKey, patch);
}

export async function getExistingTopics(): Promise<string[]> {
  const rows = await getAllContentRows();
  return rows.map((row) => row.topic.trim()).filter((topic) => topic.length > 0);
}