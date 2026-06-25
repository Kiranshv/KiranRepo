import { ContentRow, PipelineState } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface StatusCardsProps {
  todayRow: ContentRow | null;
  pipelineState: PipelineState;
}

function label(value: string | null | undefined, fallback: string = "-"): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value;
}

export function StatusCards({ todayRow, pipelineState }: StatusCardsProps): JSX.Element {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Today Topic</p>
        <p className="mt-2 text-sm leading-6 text-slate-100">{label(todayRow?.topic, "No topic yet")}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Current Status</p>
        <p className="mt-2 text-sm text-slate-100">{label(todayRow?.status, pipelineState.currentStep)}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Last Updated</p>
        <p className="mt-2 text-sm text-slate-100">{formatDateTime(todayRow?.updatedAt)}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Pipeline</p>
        <p className="mt-2 text-sm text-slate-100">
          {pipelineState.isRunning ? `Running: ${pipelineState.currentStep}` : `Idle: ${pipelineState.currentStep}`}
        </p>
      </div>
    </section>
  );
}
