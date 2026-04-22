import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";
import {
  getPendingApplications,
  getProcessedApplications,
  loginAuthority,
  processApplication,
  undoApplication,
  type Authority,
  type VerifierApplication
} from "../services/api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export default function VerifierDashboard() {
  const [applications, setApplications] = useState<VerifierApplication[]>([]);
  const [processedApplications, setProcessedApplications] = useState<VerifierApplication[]>([]);
  const [authorityId, setAuthorityId] = useState("");
  const [authorityPassword, setAuthorityPassword] = useState("");
  const [activeAuthority, setActiveAuthority] = useState<Authority | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuthority, setCheckingAuthority] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const [pendingData, processedData] = await Promise.all([
        getPendingApplications(),
        getProcessedApplications()
      ]);
      setApplications(pendingData.applications || []);
      setProcessedApplications(processedData.applications || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProcess(
    application: VerifierApplication,
    status: "Approved" | "Rejected"
  ) {
    if (!activeAuthority) {
      setError("Log in with Authority_ID and password before processing applications.");
      return;
    }

    const previousApplications = applications;
    const previousProcessedApplications = processedApplications;

    setProcessingId(application.applicationId);
    setError("");
    setApplications((current) =>
      current.filter((item) => item.applicationId !== application.applicationId)
    );
    setProcessedApplications((current) => [{ ...application, status }, ...current]);

    try {
      await processApplication({
        applicationId: application.applicationId,
        authorityId: activeAuthority.authorityId,
        status,
        verificationDetails: {
          incomeVerified: status === "Approved" ? "Y" : "N",
          academicVerified: status === "Approved" ? "Y" : "N",
          documentsStatus: status === "Approved" ? "Valid" : "Rejected",
          amountDisbursed: application.amount,
          paymentMode: "Bank Transfer"
        }
      });
    } catch (requestError) {
      setApplications(previousApplications);
      setProcessedApplications(previousProcessedApplications);
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleUndo(application: VerifierApplication) {
    const previousApplications = applications;
    const previousProcessedApplications = processedApplications;

    setProcessingId(application.applicationId);
    setError("");
    setProcessedApplications((current) =>
      current.filter((item) => item.applicationId !== application.applicationId)
    );
    setApplications((current) => [{ ...application, status: "Pending" }, ...current]);

    try {
      await undoApplication(application.applicationId);
    } catch (requestError) {
      setApplications(previousApplications);
      setProcessedApplications(previousProcessedApplications);
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleSetAuthority() {
    if (!authorityId.trim() || !authorityPassword) {
      setError("Enter Authority_ID and password before logging in.");
      return;
    }

    setCheckingAuthority(true);
    setError("");

    try {
      const data = await loginAuthority({
        authorityId: authorityId.trim(),
        password: authorityPassword
      });
      setActiveAuthority(data.authority);
      setAuthorityPassword("");
    } catch (requestError) {
      setActiveAuthority(null);
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
    } finally {
      setCheckingAuthority(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-academic-navy">
            Verifier Dashboard
          </p>
          <h2 className="mt-1 text-2xl font-bold text-academic-ink">
            Pending scholarship applications
          </h2>
        </div>
        <div className="w-full max-w-xl">
          <label className="text-sm font-semibold text-academic-ink" htmlFor="authority-id">
            Authority_ID
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              id="authority-id"
              value={authorityId}
              onChange={(event) => setAuthorityId(event.target.value)}
              placeholder="Enter Authority_ID"
              className="min-h-11 flex-1 rounded border border-academic-line bg-white px-4 outline-none focus:border-academic-navy focus:ring-2 focus:ring-academic-navy/15"
            />
            <input
              type="password"
              value={authorityPassword}
              onChange={(event) => setAuthorityPassword(event.target.value)}
              placeholder="Password"
              className="min-h-11 rounded border border-academic-line bg-white px-4 outline-none focus:border-academic-navy focus:ring-2 focus:ring-academic-navy/15"
            />
            <button
              type="button"
              onClick={handleSetAuthority}
              disabled={checkingAuthority}
              className="min-h-11 rounded border border-academic-navy bg-white px-4 text-sm font-semibold text-academic-navy transition hover:bg-[#edf3f8]"
            >
              {checkingAuthority
                ? "Checking..."
                : activeAuthority
                  ? `Logged in: ${activeAuthority.authorityId}`
                  : "Log in"}
            </button>
          </div>
          {activeAuthority && (
            <p className="mt-2 text-sm text-slate-600">
              {activeAuthority.name} | {activeAuthority.role} | {activeAuthority.department}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded border border-academic-line bg-white">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead className="bg-[#edf3f8] text-sm text-academic-ink">
            <tr>
              <th className="px-4 py-3 font-semibold">Application</th>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Institution</th>
              <th className="px-4 py-3 font-semibold">Scholarship</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                  Loading pending applications...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                  No pending applications.
                </td>
              </tr>
            ) : (
              applications.map((application) => (
                <tr key={application.applicationId} className="border-t border-academic-line">
                  <td className="px-4 py-3 font-medium">#{application.applicationId}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{application.studentName}</div>
                    <div className="text-xs text-slate-500">ID {application.studentId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{application.institution}</div>
                    <div className="text-xs text-slate-500">{application.course}</div>
                  </td>
                  <td className="px-4 py-3">{application.scholarshipName}</td>
                  <td className="px-4 py-3">{currency.format(application.amount || 0)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => void handleProcess(application, "Approved")}
                        disabled={processingId === application.applicationId}
                        className="min-h-10 rounded bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => void handleProcess(application, "Rejected")}
                        disabled={processingId === application.applicationId}
                        className="min-h-10 rounded bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-academic-navy">
            Processed Applications
          </p>
          <h3 className="mt-1 text-xl font-bold text-academic-ink">
            Approved and rejected decisions
          </h3>
        </div>

        <div className="overflow-hidden rounded border border-academic-line bg-white">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-[#edf3f8] text-sm text-academic-ink">
              <tr>
                <th className="px-4 py-3 font-semibold">Application</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Scholarship</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {processedApplications.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-center text-sm text-slate-500" colSpan={5}>
                    No approved or rejected applications yet.
                  </td>
                </tr>
              ) : (
                processedApplications.map((application) => (
                  <tr key={application.applicationId} className="border-t border-academic-line">
                    <td className="px-4 py-3 font-medium">#{application.applicationId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{application.studentName}</div>
                      <div className="text-xs text-slate-500">ID {application.studentId}</div>
                    </td>
                    <td className="px-4 py-3">{application.scholarshipName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void handleUndo(application)}
                        disabled={processingId === application.applicationId}
                        className="min-h-10 rounded border border-academic-navy bg-white px-3 text-sm font-semibold text-academic-navy hover:bg-[#edf3f8] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Undo
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
