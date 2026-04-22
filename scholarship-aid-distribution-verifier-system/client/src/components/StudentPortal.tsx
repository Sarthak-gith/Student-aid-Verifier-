import { useState } from "react";
import { getStudentDashboard, type StudentApplication } from "../services/api";
import StatusBadge from "./StatusBadge";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export default function StudentPortal() {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentId.trim()) {
      setError("Enter a Student ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getStudentDashboard(studentId.trim());
      setStudentName(data.studentName || "");
      setApplications(data.applications || []);
    } catch (requestError) {
      setStudentName("");
      setApplications([]);
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-academic-navy">
          Student Portal
        </p>
        <h2 className="mt-1 text-2xl font-bold text-academic-ink">
          Scholarship status and aid disbursement
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          placeholder="Enter Student_ID"
          className="min-h-11 flex-1 rounded border border-academic-line bg-white px-4 outline-none focus:border-academic-navy focus:ring-2 focus:ring-academic-navy/15"
        />
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded bg-academic-navy px-5 font-semibold text-white transition hover:bg-[#0c2947] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Fetching..." : "Fetch Dashboard"}
        </button>
      </form>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {studentName && (
        <div className="rounded border border-academic-line bg-white px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Student Name
          </p>
          <p className="mt-1 text-lg font-bold text-academic-ink">{studentName}</p>
        </div>
      )}

      <div className="overflow-hidden rounded border border-academic-line bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead className="bg-[#edf3f8] text-sm text-academic-ink">
            <tr>
              <th className="px-4 py-3 font-semibold">Scholarship Name</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Disbursed Amount</th>
              <th className="px-4 py-3 font-semibold">Payment Mode</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={4}>
                  No applications to display.
                </td>
              </tr>
            ) : (
              applications.map((application) => (
                <tr key={application.applicationId} className="border-t border-academic-line">
                  <td className="px-4 py-3 font-medium">{application.scholarshipName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="px-4 py-3">
                    {application.amountDisbursed
                      ? currency.format(application.amountDisbursed)
                      : "Not disbursed"}
                  </td>
                  <td className="px-4 py-3">{application.paymentMode || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
