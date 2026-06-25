import { createActivityLog } from "@/lib/repositories/activityLogRepository";
import { getContentRowByRunDateKey, updatePublishFields } from "@/lib/repositories/contentRepository";
import { publishDevtoArticle } from "@/lib/devtoClient";
import { publishLinkedInPost } from "@/lib/linkedinClient";
import { PublishResult } from "@/lib/types";
import { getTodayRunDateKey, inferDevtoTagsFromTopic } from "@/lib/utils";

async function getTargetRow(runDateKey?: string) {
  const resolvedKey = runDateKey ?? getTodayRunDateKey();
  const row = await getContentRowByRunDateKey(resolvedKey);
  if (!row) {
    throw new Error(`No content row found for ${resolvedKey}.`);
  }
  return row;
}

export async function publishToLinkedIn(runDateKey?: string): Promise<PublishResult> {
  const row = await getTargetRow(runDateKey);
  await updatePublishFields(row.runDateKey, {
    linkedInPublishStatus: "Publishing",
    lastAgent: "Publisher"
  });

  const result = await publishLinkedInPost({
    text: row.linkedInPost,
    imageUrl: row.linkedInImageUrl || undefined
  });

  await updatePublishFields(row.runDateKey, {
    linkedInPublishStatus: result.success ? "Published" : "Failed",
    linkedInPostId: result.externalId ?? row.linkedInPostId,
    linkedInUrl: result.url ?? row.linkedInUrl,
    linkedInPublishedAt: result.success ? new Date().toISOString() : row.linkedInPublishedAt,
    publishErrors: result.success ? row.publishErrors : [row.publishErrors, result.message].filter(Boolean).join(" | "),
    lastAgent: "Publisher"
  });

  await createActivityLog({
    runDateKey: row.runDateKey,
    contentRowId: row.id,
    agent: "Publisher",
    action: "linkedin_publish",
    details: result.message
  });

  return result;
}

export async function publishToDevto(runDateKey?: string, published?: boolean): Promise<PublishResult> {
  const row = await getTargetRow(runDateKey);
  await updatePublishFields(row.runDateKey, {
    devtoPublishStatus: "Publishing",
    lastAgent: "Publisher"
  });

  const result = await publishDevtoArticle({
    title: row.topic,
    bodyMarkdown: row.devtoArticle,
    published,
    tags: inferDevtoTagsFromTopic(row.topic),
    coverImage: row.mediumImageUrl || undefined
  });

  await updatePublishFields(row.runDateKey, {
    devtoPublishStatus: result.success ? (published ? "Published" : "Draft") : "Failed",
    devtoArticleId: result.externalId ?? row.devtoArticleId,
    devtoUrl: result.url ?? row.devtoUrl,
    devtoPublishedAt: result.success && published ? new Date().toISOString() : row.devtoPublishedAt,
    publishErrors: result.success ? row.publishErrors : [row.publishErrors, result.message].filter(Boolean).join(" | "),
    lastAgent: "Publisher"
  });

  await createActivityLog({
    runDateKey: row.runDateKey,
    contentRowId: row.id,
    agent: "Publisher",
    action: "devto_publish",
    details: result.message
  });

  return result;
}

export async function publishAllSupported(runDateKey?: string): Promise<PublishResult[]> {
  const linkedIn = await publishToLinkedIn(runDateKey);
  const devto = await publishToDevto(runDateKey, false);
  return [linkedIn, devto];
}