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
  token: string;
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

export type StudentRegistrationPayload = {
  studentId: number;
  name: string;
  dob: string;
  gender: string;
  category: string;
  income: number;
  institution: string;
  course: string;
  password: string;
};

export type StudentLoginPayload = {
  studentId: number;
  password: string;
};

export type StudentLoginResponse = {
  message: string;
  student: {
    studentId: number;
    name: string;
  };
  token: string;
};

export type StudentProfileDocument = {
  applicationDocumentId: number;
  applicationId: number;
  documentType: string;
  documentLabel: string | null;
  fileName: string;
  filePath: string;
  mimeType: string;
  uploadedAt: string;
};

export type StudentProfileTimelineEvent = {
  applicationStatusHistoryId: number;
  applicationId: number;
  status: ApplicationStatus | string;
  eventType: string;
  notes: string | null;
  actorRole: string;
  actorId: number | null;
  changedAt: string;
};

export type StudentProfileApplication = {
  applicationId: number;
  applicationDate: string;
  status: ApplicationStatus | string;
  scholarshipId: number;
  scholarshipName: string;
  scholarshipAmount: number;
  amountDisbursed: number | null;
  disbursementDate: string | null;
  paymentMode: string | null;
  documents: StudentProfileDocument[];
  timeline: StudentProfileTimelineEvent[];
};

export type StudentProfileResponse = {
  student: {
    studentId: number;
    name: string;
    dob: string;
    gender: string;
    category: string;
    income: number;
    institution: string;
    course: string;
  };
  applications: StudentProfileApplication[];
};

export type SubmitApplicationPayload = {
  studentId: number;
  scholarshipId: number;
};

type SubmitApplicationResponse = {
  message: string;
  application: {
    applicationId: number;
    studentId: number;
    scholarshipId: number;
    status: ApplicationStatus | string;
  };
};

type UploadDocumentPayload = {
  documentType: "income-proof" | "marksheet" | "caste-certificate" | "bank-passbook" | "other";
  documentLabel?: string;
  file: File;
};

type RequestOptions = RequestInit & {
  token?: string;
  isJson?: boolean;
};

async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { token, isJson = true, headers, body, ...restOptions } = options;
  const requestHeaders: Record<string, string> = {
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined)
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: requestHeaders,
    body
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
    isJson: true,
    body: JSON.stringify(payload)
  });
}

export function processApplication(payload: ProcessApplicationPayload) {
  return request<ProcessApplicationResponse>("/applications/process", {
    method: "POST",
    isJson: true,
    body: JSON.stringify(payload)
  });
}

export function undoApplication(applicationId: number) {
  return request<UndoApplicationResponse>("/applications/undo", {
    method: "POST",
    isJson: true,
    body: JSON.stringify({ applicationId })
  });
}

export function registerStudent(payload: StudentRegistrationPayload) {
  return request<{ message: string; student: StudentProfileResponse["student"] }>("/student/register", {
    method: "POST",
    isJson: true,
    body: JSON.stringify(payload)
  });
}

export function loginStudent(payload: StudentLoginPayload) {
  return request<StudentLoginResponse>("/student/login", {
    method: "POST",
    isJson: true,
    body: JSON.stringify(payload)
  });
}

export function getStudentProfile(token: string) {
  return request<StudentProfileResponse>("/student/profile", {
    token
  });
}

export function submitStudentApplication(payload: SubmitApplicationPayload, token: string) {
  return request<SubmitApplicationResponse>("/applications/submit", {
    method: "POST",
    token,
    isJson: true,
    body: JSON.stringify(payload)
  });
}

export function uploadStudentApplicationDocument(
  applicationId: number,
  payload: UploadDocumentPayload,
  token: string
) {
  const formData = new FormData();
  formData.append("documentType", payload.documentType);
  if (payload.documentLabel?.trim()) {
    formData.append("documentLabel", payload.documentLabel.trim());
  }
  formData.append("document", payload.file);

  return request<{
    message: string;
    document: StudentProfileDocument;
  }>(`/applications/${applicationId}/documents`, {
    method: "POST",
    token,
    isJson: false,
    body: formData
  });
}
