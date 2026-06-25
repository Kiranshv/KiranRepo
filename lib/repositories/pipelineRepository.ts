import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { PipelineState, PipelineStep } from "@/lib/types";

interface PipelineStateRecord {
  id: string;
  is_running: boolean;
  current_step: PipelineStep;
  last_run_at: string | null;
  last_error: string | null;
  current_topic: string | null;
  next_scheduled_run: string | null;
  updated_at: string;
}

function mapPipelineState(record: PipelineStateRecord): PipelineState {
  return {
    isRunning: record.is_running,
    currentStep: record.current_step,
    lastRunAt: record.last_run_at,
    lastError: record.last_error,
    currentTopic: record.current_topic,
    nextScheduledRun: record.next_scheduled_run
  };
}

function mapPatch(
  patch: Partial<PipelineState & { updatedAt?: string }>
): Partial<PipelineStateRecord> {
  const next: Partial<PipelineStateRecord> = {};
  if (patch.isRunning !== undefined) next.is_running = patch.isRunning;
  if (patch.currentStep !== undefined) next.current_step = patch.currentStep;
  if (patch.lastRunAt !== undefined) next.last_run_at = patch.lastRunAt;
  if (patch.lastError !== undefined) next.last_error = patch.lastError;
  if (patch.currentTopic !== undefined) next.current_topic = patch.currentTopic;
  if (patch.nextScheduledRun !== undefined) next.next_scheduled_run = patch.nextScheduledRun;
  if (patch.updatedAt !== undefined) next.updated_at = patch.updatedAt;
  return next;
}

export async function initializePipelineStateIfMissing(): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("pipeline_state").upsert({ id: "main" }, { onConflict: "id" });
  if (error) {
    throw new Error(`Failed to initialize pipeline state: ${error.message}`);
  }
}

export async function getPipelineState(): Promise<PipelineState> {
  await initializePipelineStateIfMissing();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("pipeline_state").select("*").eq("id", "main").single();

  if (error) {
    throw new Error(`Failed to load pipeline state: ${error.message}`);
  }

  return mapPipelineState(data as PipelineStateRecord);
}

export async function tryAcquirePipelineLock(step: PipelineStep, topic?: string): Promise<boolean> {
  await initializePipelineStateIfMissing();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pipeline_state")
    .update({
      is_running: true,
      current_step: step,
      current_topic: topic ?? null,
      last_error: null,
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", "main")
    .eq("is_running", false)
    .select("id");

  if (error) {
    throw new Error(`Failed to acquire pipeline lock: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

export async function setPipelineRunning(step: PipelineStep, topic?: string): Promise<void> {
  await updatePipelineState({
    isRunning: true,
    currentStep: step,
    currentTopic: topic ?? null,
    lastError: null,
    lastRunAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

export async function setPipelineIdle(): Promise<void> {
  await updatePipelineState({
    isRunning: false,
    currentStep: "idle",
    currentTopic: null,
    lastError: null,
    lastRunAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

export async function setPipelineError(message: string): Promise<void> {
  await updatePipelineState({
    isRunning: false,
    currentStep: "error",
    lastError: message,
    lastRunAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

export async function updatePipelineState(
  patch: Partial<PipelineState & { updatedAt?: string }>
): Promise<void> {
  await initializePipelineStateIfMissing();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("pipeline_state").update(mapPatch(patch)).eq("id", "main");
  if (error) {
    throw new Error(`Failed to update pipeline state: ${error.message}`);
  }
}