import { runContentWriter, runTopicGenerator } from "@/lib/agents";
import { createActivityLog } from "@/lib/repositories/activityLogRepository";
import { appendContentError, getContentRowByRunDateKey, updateContentRowByRunDateKey } from "@/lib/repositories/contentRepository";
import {
  getPipelineState,
  initializePipelineStateIfMissing,
  setPipelineError,
  setPipelineIdle,
  tryAcquirePipelineLock,
  updatePipelineState
} from "@/lib/repositories/pipelineRepository";
import { PipelineState } from "@/lib/types";
import { getTodayRunDateKey, safeErrorMessage } from "@/lib/utils";

class PipelineAlreadyRunningError extends Error {
  constructor() {
    super("Pipeline is already running");
    this.name = "PipelineAlreadyRunningError";
  }
}

export async function runPipeline(): Promise<void> {
  await initializePipelineStateIfMissing();
  const locked = await tryAcquirePipelineLock("topic");
  if (!locked) {
    throw new PipelineAlreadyRunningError();
  }
  await executePipeline();
}

async function executePipeline(): Promise<void> {
  try {
    const topicRow = await runTopicGenerator();
    await updatePipelineState({ currentStep: "writing", currentTopic: topicRow.topic, isRunning: true });
    await createActivityLog({
      runDateKey: topicRow.runDateKey,
      contentRowId: topicRow.id,
      agent: "System",
      action: "pipeline_topic_complete",
      details: topicRow.topic
    });

    await runContentWriter();
    await updatePipelineState({ currentStep: "done", isRunning: true, currentTopic: topicRow.topic });
    await updateContentRowByRunDateKey(topicRow.runDateKey, { status: "ReadyForImages", lastAgent: "System" });
    await createActivityLog({
      runDateKey: topicRow.runDateKey,
      contentRowId: topicRow.id,
      agent: "System",
      action: "pipeline_done",
      details: "Content generation completed and waiting for manual images."
    });
    await setPipelineIdle();
  } catch (error: unknown) {
    const message = safeErrorMessage(error);

    await setPipelineError(message);

    const today = await getContentRowByRunDateKey(getTodayRunDateKey());
    if (today) {
      await appendContentError(today.runDateKey, message);
      await updateContentRowByRunDateKey(today.runDateKey, { status: "Error", lastAgent: "System" });
      await createActivityLog({
        runDateKey: today.runDateKey,
        contentRowId: today.id,
        agent: "System",
        action: "pipeline_failed",
        details: message
      });
    }

    throw error;
  } finally {
    const state = await getPipelineState();
    if (state.isRunning) {
      await setPipelineIdle();
    }
  }
}

export { PipelineAlreadyRunningError };
