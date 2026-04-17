const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed.");
  }

  return data;
}

export function getStudentDashboard(studentId) {
  return request(`/student/${encodeURIComponent(studentId)}`);
}

export function getPendingApplications() {
  return request("/applications/pending");
}

export function getProcessedApplications() {
  return request("/applications/processed");
}

export function getAuthority(authorityId) {
  return request(`/authorities/${encodeURIComponent(authorityId)}`);
}

export function loginAuthority(payload) {
  return request("/authorities/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function processApplication(payload) {
  return request("/applications/process", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function undoApplication(applicationId) {
  return request("/applications/undo", {
    method: "POST",
    body: JSON.stringify({ applicationId })
  });
}
