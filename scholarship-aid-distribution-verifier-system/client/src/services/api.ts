const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export type ApplicationStatus = "Approved" | "Pending" | "Rejected";

export type StudentApplication = {
  applicationId: number;
  scholarshipName: string;
  status: ApplicationStatus | string;
  amountDisbursed: number | null;
  disbursementDate?: string | null;
  paymentMode: string | null;
};

export type StudentDashboardResponse = {
  studentId: string;
  studentName: string | null;
  applications: StudentApplication[];
};

export type Authority = {
  authorityId: number;
  name: string;
  role: string;
  department: string;
};

export type AuthorityResponse = {
  authority: Authority;
};

export type VerifierApplication = {
  applicationId: number;
  applicationDate: string;
  studentId: number;
  studentName: string;
  institution: string;
  course: string;
  scholarshipId: number;
  scholarshipName: string;
  amount: number | null;
  status: ApplicationStatus | string;
};

export type ApplicationsResponse = {
  applications: VerifierApplication[];
};

export type VerificationDetails = {
  incomeVerified?: string | number | boolean;
  academicVerified?: string | number | boolean;
  documentsStatus?: string;
  amountDisbursed?: number | null;
  paymentMode?: string;
};

export type LoginAuthorityPayload = {
  authorityId: string;
  password: string;
};

export type ProcessApplicationPayload = {
  applicationId: number;
  authorityId: number;
  status: Extract<ApplicationStatus, "Approved" | "Rejected">;
  verificationDetails?: VerificationDetails;
};

type ProcessApplicationResponse = {
  message: string;
  applicationId: number;
  status: ApplicationStatus;
  disbursement: {
    disbursementId: number;
    amountDisbursed: number;
    paymentMode: string;
  } | null;
};

type UndoApplicationResponse = {
  message: string;
  applicationId: number;
  status: ApplicationStatus;
};

async function request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, string> & TResponse;

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed.");
  }

  return data;
}

export function getStudentDashboard(studentId: string) {
  return request<StudentDashboardResponse>(`/student/${encodeURIComponent(studentId)}`);
}

export function getPendingApplications() {
  return request<ApplicationsResponse>("/applications/pending");
}

export function getProcessedApplications() {
  return request<ApplicationsResponse>("/applications/processed");
}

export function getAuthority(authorityId: string) {
  return request<AuthorityResponse>(`/authorities/${encodeURIComponent(authorityId)}`);
}

export function loginAuthority(payload: LoginAuthorityPayload) {
  return request<AuthorityResponse>("/authorities/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function processApplication(payload: ProcessApplicationPayload) {
  return request<ProcessApplicationResponse>("/applications/process", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function undoApplication(applicationId: number) {
  return request<UndoApplicationResponse>("/applications/undo", {
    method: "POST",
    body: JSON.stringify({ applicationId })
  });
}
