import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ActivityLogEntry } from "@/lib/types";

interface ActivityLogRecord {
  id: string;
  run_date_key: string | null;
  content_row_id: string | null;
  agent: string;
  action: string;
  details: string;
  created_at: string;
}

function mapActivityLog(record: ActivityLogRecord): ActivityLogEntry {
  return {
    id: record.id,
    runDateKey: record.run_date_key ?? "",
    contentRowId: record.content_row_id,
    agent: record.agent,
    action: record.action,
    details: record.details,
    createdAt: record.created_at
  };
}

export async function createActivityLog(input: {
  runDateKey?: string | null;
  contentRowId?: string | null;
  agent: string;
  action: string;
  details?: string;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("activity_logs").insert({
    run_date_key: input.runDateKey ?? null,
    content_row_id: input.contentRowId ?? null,
    agent: input.agent,
    action: input.action,
    details: input.details ?? ""
  });

  if (error) {
    throw new Error(`Failed to create activity log: ${error.message}`);
  }
}

export async function getRecentActivityLogs(limit: number = 30): Promise<ActivityLogEntry[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load activity logs: ${error.message}`);
  }

  return (data ?? []).map((record) => mapActivityLog(record as ActivityLogRecord));
}