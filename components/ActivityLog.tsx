import { ActivityLogEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface ActivityLogProps {
  logs: ActivityLogEntry[];
}

export function ActivityLog({ logs }: ActivityLogProps): JSX.Element {
  return (
    <section className="rounded-3xl border border-border bg-card/80 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Recent Activity</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Supabase logs</span>
      </div>
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted">No activity logged yet.</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border/70 bg-slate-950/40 p-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-semibold text-slate-100">
                  {entry.agent} · {entry.action}
                </p>
                <p className="text-xs text-muted">{formatDateTime(entry.createdAt)}</p>
              </div>
              <p className="mt-2 text-sm text-slate-300">{entry.details || "-"}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}