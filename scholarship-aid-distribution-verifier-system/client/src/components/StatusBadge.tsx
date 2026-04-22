import type { ApplicationStatus } from "../services/api";

const statusStyles: Record<string, string> = {
  Approved: "bg-green-100 text-green-800 border-green-200",
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Rejected: "bg-red-100 text-red-800 border-red-200"
};

type StatusBadgeProps = {
  status: ApplicationStatus | string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded border px-2.5 py-1 text-xs font-semibold ${
        statusStyles[status] || "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}
