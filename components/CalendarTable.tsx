import { ContentRow } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface CalendarTableProps {
  rows: ContentRow[];
}

function statusClasses(status: ContentRow["status"]): string {
  switch (status) {
    case "Done":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-400/40";
    case "DoneWithImageError":
      return "bg-orange-500/20 text-orange-200 border-orange-400/40";
    case "ReadyForImages":
      return "bg-sky-500/20 text-sky-200 border-sky-400/40";
    case "Error":
      return "bg-red-500/20 text-red-300 border-red-400/40";
    case "Imaging":
      return "bg-cyan-500/20 text-cyan-300 border-cyan-400/40";
    case "Writing":
      return "bg-amber-500/20 text-amber-300 border-amber-400/40";
    default:
      return "bg-slate-600/20 text-slate-200 border-slate-400/40";
  }
}

export function CalendarTable({ rows }: CalendarTableProps): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Topic</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">LinkedIn</th>
            <th className="px-4 py-3">Dev.to</th>
            <th className="px-4 py-3">Images</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-muted">
                No rows in content calendar yet.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-b-0">
                <td className="px-4 py-3 font-mono text-xs text-slate-200">{row.date}</td>
                <td className="px-4 py-3 text-slate-100">{row.topic || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-1 text-xs ${statusClasses(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{row.linkedInPublishStatus}</td>
                <td className="px-4 py-3 text-slate-300">{row.devtoPublishStatus}</td>
                <td className="px-4 py-3 text-slate-300">
                  {[row.linkedInImageUrl, row.mediumImageUrl, row.igImageUrl].filter(Boolean).length}/3
                </td>
                <td className="px-4 py-3 text-slate-300">{formatDateTime(row.updatedAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
