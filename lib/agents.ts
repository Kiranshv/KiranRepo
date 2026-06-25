import {
  generateDevtoArticle,
  generateFreshTopic,
  generateInstagramScript,
  generateLinkedInPost,
  generateMediumArticle,
  generateYoutubeScript
} from "@/lib/groqClient";
import { createActivityLog } from "@/lib/repositories/activityLogRepository";
import {
  appendContentError,
  getContentRowByRunDateKey,
  getExistingTopics,
  setContentStatus,
  updateContentRowByRunDateKey,
  upsertTodayRow
} from "@/lib/repositories/contentRepository";
import { ContentRow } from "@/lib/types";
import { getTodayRunDateKey, safeErrorMessage } from "@/lib/utils";

export async function runTopicGenerator(): Promise<ContentRow> {
  const runDateKey = getTodayRunDateKey();
  const todayRow = await getContentRowByRunDateKey(runDateKey);

  if (todayRow && todayRow.topic.trim()) {
    await createActivityLog({
      runDateKey,
      contentRowId: todayRow.id,
      agent: "TopicGenerator",
      action: "reused_topic",
      details: todayRow.topic
    });
    return todayRow;
  }

  const topic = await generateFreshTopic(await getExistingTopics());
  const row = await upsertTodayRow({
    runDateKey,
    topic,
    status: "Pending",
    errorMessage: "",
    lastAgent: "TopicGenerator"
  });

  await createActivityLog({
    runDateKey,
    contentRowId: row.id,
    agent: "TopicGenerator",
    action: "generated_topic",
    details: topic
  });

  return row;
}

export async function runContentWriter(runDateKey: string = getTodayRunDateKey()): Promise<ContentRow> {
  const row = await getContentRowByRunDateKey(runDateKey);

  if (!row) {
    throw new Error("No row found for today. TopicGenerator must run first.");
  }

  if (!row.topic.trim()) {
    throw new Error("Today's row has no topic. Cannot generate content.");
  }

  try {
    await setContentStatus(runDateKey, "Writing", "ContentWriter");
    await updateContentRowByRunDateKey(runDateKey, { errorMessage: "", lastAgent: "ContentWriter" });

    const linkedInPost = await generateLinkedInPost(row.topic);
    await updateContentRowByRunDateKey(runDateKey, { linkedInPost, lastAgent: "ContentWriter" });
    await createActivityLog({ runDateKey, contentRowId: row.id, agent: "ContentWriter", action: "linkedin_post", details: "Generated LinkedIn post" });

    const mediumArticle = await generateMediumArticle(row.topic);
    await updateContentRowByRunDateKey(runDateKey, { mediumArticle, lastAgent: "ContentWriter" });
    await createActivityLog({ runDateKey, contentRowId: row.id, agent: "ContentWriter", action: "medium_article", details: "Generated Medium article" });

    const igScript = await generateInstagramScript(row.topic);
    await updateContentRowByRunDateKey(runDateKey, { igScript, lastAgent: "ContentWriter" });
    await createActivityLog({ runDateKey, contentRowId: row.id, agent: "ContentWriter", action: "instagram_script", details: "Generated Instagram script" });

    const ytScript = await generateYoutubeScript(row.topic);
    await updateContentRowByRunDateKey(runDateKey, { ytScript, lastAgent: "ContentWriter" });
    await createActivityLog({ runDateKey, contentRowId: row.id, agent: "ContentWriter", action: "youtube_script", details: "Generated YouTube script" });

    const devtoArticle = await generateDevtoArticle(row.topic);
    const doneWriting = await updateContentRowByRunDateKey(runDateKey, {
      devtoArticle,
      status: "ReadyForImages",
      lastAgent: "ContentWriter"
    });
    await createActivityLog({ runDateKey, contentRowId: row.id, agent: "ContentWriter", action: "devto_article", details: "Generated Dev.to article" });

    return doneWriting;
  } catch (error: unknown) {
    const message = safeErrorMessage(error);
    await appendContentError(runDateKey, message);
    await updateContentRowByRunDateKey(runDateKey, { status: "Error", lastAgent: "ContentWriter" });
    await createActivityLog({ runDateKey, contentRowId: row.id, agent: "ContentWriter", action: "failed", details: message });
    throw error;
  }
}
