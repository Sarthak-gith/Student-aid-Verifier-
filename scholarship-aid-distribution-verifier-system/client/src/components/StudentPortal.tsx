import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";
import {
  getStudentProfile,
  loginStudent,
  registerStudent,
  submitStudentApplication,
  uploadStudentApplicationDocument,
  type StudentProfileApplication,
  type StudentProfileResponse
} from "../services/api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short"
});

const dateOnly = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium"
});

const STUDENT_TOKEN_KEY = "studentAuthToken";

type UploadDocumentType =
  | "income-proof"
  | "marksheet"
  | "caste-certificate"
  | "bank-passbook"
  | "other";

type UploadDraft = {
  documentType: UploadDocumentType;
  documentLabel: string;
  file: File | null;
};

const defaultUploadDraft: UploadDraft = {
  documentType: "income-proof",
  documentLabel: "",
  file: null
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateTime.format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateOnly.format(date);
}

export default function StudentPortal() {
  const [registerForm, setRegisterForm] = useState({
    studentId: "",
    name: "",
    dob: "",
    gender: "",
    category: "",
    income: "",
    institution: "",
    course: "",
    password: ""
  });
  const [loginForm, setLoginForm] = useState({
    studentId: "",
    password: ""
  });
  const [submitForm, setSubmitForm] = useState({
    scholarshipId: ""
  });
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [uploadDrafts, setUploadDrafts] = useState<Record<number, UploadDraft>>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingApplicationId, setUploadingApplicationId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem(STUDENT_TOKEN_KEY);
    if (!savedToken) {
      return;
    }

    void fetchProfile(savedToken);
  }, []);

  async function fetchProfile(authToken: string) {
    setLoadingProfile(true);
    setError("");

    try {
      const data = await getStudentProfile(authToken);
      setToken(authToken);
      setProfile(data);
      localStorage.setItem(STUDENT_TOKEN_KEY, authToken);
    } catch (requestError) {
      setToken("");
      setProfile(null);
      localStorage.removeItem(STUDENT_TOKEN_KEY);
      setError(requestError instanceof Error ? requestError.message : "Failed to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  }

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function handleLogout() {
    setToken("");
    setProfile(null);
    setUploadDrafts({});
    localStorage.removeItem(STUDENT_TOKEN_KEY);
    setSuccess("Logged out successfully.");
    setError("");
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    if (!registerForm.studentId || !registerForm.income) {
      setError("Student ID and income are required.");
      return;
    }

    setRegistering(true);

    try {
      await registerStudent({
        studentId: Number(registerForm.studentId),
        name: registerForm.name.trim(),
        dob: registerForm.dob,
        gender: registerForm.gender.trim(),
        category: registerForm.category.trim(),
        income: Number(registerForm.income),
        institution: registerForm.institution.trim(),
        course: registerForm.course.trim(),
        password: registerForm.password
      });

      setSuccess("Registration completed. Log in to access your dashboard.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Registration failed.");
    } finally {
      setRegistering(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    if (!loginForm.studentId || !loginForm.password) {
      setError("Enter Student ID and password.");
      return;
    }

    setLoggingIn(true);

    try {
      const data = await loginStudent({
        studentId: Number(loginForm.studentId),
        password: loginForm.password
      });

      await fetchProfile(data.token);
      setSuccess(`Welcome, ${data.student.name}.`);
      setLoginForm((current) => ({ ...current, password: "" }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSubmitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    if (!profile || !token) {
      setError("Log in before submitting applications.");
      return;
    }

    if (!submitForm.scholarshipId) {
      setError("Enter a Scholarship ID.");
      return;
    }

    setSubmitting(true);

    try {
      await submitStudentApplication(
        {
          studentId: profile.student.studentId,
          scholarshipId: Number(submitForm.scholarshipId)
        },
        token
      );

      setSubmitForm({ scholarshipId: "" });
      await fetchProfile(token);
      setSuccess("Application submitted successfully.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Application submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function getUploadDraft(applicationId: number) {
    return uploadDrafts[applicationId] || defaultUploadDraft;
  }

  function updateUploadDraft(applicationId: number, updates: Partial<UploadDraft>) {
    setUploadDrafts((current) => ({
      ...current,
      [applicationId]: {
        ...getUploadDraft(applicationId),
        ...updates
      }
    }));
  }

  async function handleUploadDocument(application: StudentProfileApplication) {
    resetMessages();

    if (!token) {
      setError("Log in before uploading documents.");
      return;
    }

    const draft = getUploadDraft(application.applicationId);
    if (!draft.file) {
      setError("Select a file before uploading.");
      return;
    }

    setUploadingApplicationId(application.applicationId);

    try {
      await uploadStudentApplicationDocument(
        application.applicationId,
        {
          documentType: draft.documentType,
          documentLabel: draft.documentLabel,
          file: draft.file
        },
        token
      );

      updateUploadDraft(application.applicationId, {
        documentLabel: "",
        file: null
      });
      await fetchProfile(token);
      setSuccess(`Document uploaded for application #${application.applicationId}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Document upload failed.");
    } finally {
      setUploadingApplicationId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-academic-navy">
          Student Portal
        </p>
        <h2 className="mt-1 text-2xl font-bold text-academic-ink">
          Profile dashboard, applications, uploads, and status timeline
        </h2>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </p>
      )}

      {!profile ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form
            onSubmit={handleRegister}
            className="space-y-3 rounded border border-academic-line bg-white p-4"
          >
            <h3 className="text-lg font-bold text-academic-ink">Register Student</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={registerForm.studentId}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, studentId: event.target.value }))
                }
                placeholder="Student_ID"
                className="rounded border border-academic-line px-3 py-2"
              />
              <input
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Name"
                className="rounded border border-academic-line px-3 py-2"
              />
              <input
                type="date"
                value={registerForm.dob}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, dob: event.target.value }))
                }
                className="rounded border border-academic-line px-3 py-2"
              />
              <input
                value={registerForm.gender}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, gender: event.target.value }))
                }
                placeholder="Gender"
                className="rounded border border-academic-line px-3 py-2"
              />
              <input
                value={registerForm.category}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, category: event.target.value }))
                }
                placeholder="Category"
                className="rounded border border-academic-line px-3 py-2"
              />
              <input
                value={registerForm.income}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, income: event.target.value }))
                }
                placeholder="Income"
                className="rounded border border-academic-line px-3 py-2"
              />
              <input
                value={registerForm.institution}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, institution: event.target.value }))
                }
                placeholder="Institution"
                className="rounded border border-academic-line px-3 py-2 sm:col-span-2"
              />
              <input
                value={registerForm.course}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, course: event.target.value }))
                }
                placeholder="Course"
                className="rounded border border-academic-line px-3 py-2 sm:col-span-2"
              />
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Password (min 8 chars)"
                className="rounded border border-academic-line px-3 py-2 sm:col-span-2"
              />
            </div>

            <button
              type="submit"
              disabled={registering}
              className="rounded bg-academic-navy px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {registering ? "Registering..." : "Register"}
            </button>
          </form>

          <form
            onSubmit={handleLogin}
            className="space-y-3 rounded border border-academic-line bg-white p-4"
          >
            <h3 className="text-lg font-bold text-academic-ink">Login Student</h3>
            <input
              value={loginForm.studentId}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, studentId: event.target.value }))
              }
              placeholder="Student_ID"
              className="w-full rounded border border-academic-line px-3 py-2"
            />
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Password"
              className="w-full rounded border border-academic-line px-3 py-2"
            />
            <button
              type="submit"
              disabled={loggingIn || loadingProfile}
              className="rounded border border-academic-navy px-4 py-2 font-semibold text-academic-navy disabled:opacity-60"
            >
              {loggingIn ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="rounded border border-academic-line bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Logged in as</p>
                <h3 className="text-xl font-bold text-academic-ink">
                  {profile.student.name} (ID {profile.student.studentId})
                </h3>
                <p className="text-sm text-slate-600">
                  {profile.student.course} | {profile.student.institution}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-academic-navy px-4 py-2 text-sm font-semibold text-academic-navy"
              >
                Logout
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmitApplication}
            className="rounded border border-academic-line bg-white p-4"
          >
            <h3 className="text-lg font-bold text-academic-ink">Submit New Application</h3>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={submitForm.scholarshipId}
                onChange={(event) =>
                  setSubmitForm((current) => ({ ...current, scholarshipId: event.target.value }))
                }
                placeholder="Scholarship_ID"
                className="flex-1 rounded border border-academic-line px-3 py-2"
              />
              <button
                type="submit"
                disabled={submitting || loadingProfile}
                className="rounded bg-academic-navy px-4 py-2 font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-academic-ink">Past Applications & Timeline</h3>
            {profile.applications.length === 0 ? (
              <div className="rounded border border-academic-line bg-white p-4 text-sm text-slate-600">
                No applications yet.
              </div>
            ) : (
              profile.applications.map((application) => {
                const draft = getUploadDraft(application.applicationId);

                return (
                  <article
                    key={application.applicationId}
                    className="space-y-4 rounded border border-academic-line bg-white p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-academic-ink">
                          #{application.applicationId} | {application.scholarshipName}
                        </h4>
                        <p className="text-sm text-slate-600">
                          Applied: {formatDate(application.applicationDate)} | Scholarship Amount:{" "}
                          {currency.format(application.scholarshipAmount || 0)}
                        </p>
                      </div>
                      <StatusBadge status={application.status} />
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded border border-academic-line p-3">
                        <p className="text-slate-500">Disbursed</p>
                        <p className="font-semibold text-academic-ink">
                          {application.amountDisbursed
                            ? currency.format(application.amountDisbursed)
                            : "Not disbursed"}
                        </p>
                      </div>
                      <div className="rounded border border-academic-line p-3">
                        <p className="text-slate-500">Disbursement Date</p>
                        <p className="font-semibold text-academic-ink">
                          {formatDate(application.disbursementDate)}
                        </p>
                      </div>
                      <div className="rounded border border-academic-line p-3">
                        <p className="text-slate-500">Payment Mode</p>
                        <p className="font-semibold text-academic-ink">
                          {application.paymentMode || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-semibold text-academic-ink">Upload Document</h5>
                      <div className="grid gap-2 md:grid-cols-[180px_1fr_1fr_auto]">
                        <select
                          value={draft.documentType}
                          onChange={(event) =>
                            updateUploadDraft(application.applicationId, {
                              documentType: event.target.value as UploadDocumentType
                            })
                          }
                          className="rounded border border-academic-line px-3 py-2"
                        >
                          <option value="income-proof">Income Proof</option>
                          <option value="marksheet">Marksheet</option>
                          <option value="caste-certificate">Caste Certificate</option>
                          <option value="bank-passbook">Bank Passbook</option>
                          <option value="other">Other</option>
                        </select>
                        <input
                          value={draft.documentLabel}
                          onChange={(event) =>
                            updateUploadDraft(application.applicationId, {
                              documentLabel: event.target.value
                            })
                          }
                          placeholder="Document label (optional)"
                          className="rounded border border-academic-line px-3 py-2"
                        />
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(event) =>
                            updateUploadDraft(application.applicationId, {
                              file: event.target.files?.[0] || null
                            })
                          }
                          className="rounded border border-academic-line px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => void handleUploadDocument(application)}
                          disabled={uploadingApplicationId === application.applicationId}
                          className="rounded border border-academic-navy px-3 py-2 text-sm font-semibold text-academic-navy disabled:opacity-60"
                        >
                          {uploadingApplicationId === application.applicationId ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-semibold text-academic-ink">
                        Uploaded Documents ({application.documents.length})
                      </h5>
                      {application.documents.length === 0 ? (
                        <p className="text-sm text-slate-600">No documents uploaded.</p>
                      ) : (
                        <div className="overflow-hidden rounded border border-academic-line">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-[#edf3f8]">
                              <tr>
                                <th className="px-3 py-2">Type</th>
                                <th className="px-3 py-2">Label</th>
                                <th className="px-3 py-2">File</th>
                                <th className="px-3 py-2">Uploaded At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {application.documents.map((document) => (
                                <tr
                                  key={document.applicationDocumentId}
                                  className="border-t border-academic-line"
                                >
                                  <td className="px-3 py-2">{document.documentType}</td>
                                  <td className="px-3 py-2">{document.documentLabel || "-"}</td>
                                  <td className="px-3 py-2">{document.fileName}</td>
                                  <td className="px-3 py-2">{formatTimestamp(document.uploadedAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-semibold text-academic-ink">
                        Application Timeline ({application.timeline.length})
                      </h5>
                      {application.timeline.length === 0 ? (
                        <p className="text-sm text-slate-600">Timeline will appear after status events.</p>
                      ) : (
                        <div className="space-y-2">
                          {application.timeline.map((event) => (
                            <div
                              key={event.applicationStatusHistoryId}
                              className="rounded border border-academic-line px-3 py-2 text-sm"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-academic-ink">{event.eventType}</span>
                                <StatusBadge status={event.status} />
                                <span className="text-slate-500">{formatTimestamp(event.changedAt)}</span>
                              </div>
                              <p className="mt-1 text-slate-600">
                                Actor: {event.actorRole}
                                {event.actorId ? ` (${event.actorId})` : ""}
                              </p>
                              {event.notes && <p className="mt-1 text-slate-700">{event.notes}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
}
