import type { LoanApplication, AppStatus, AuthUser } from "./store";

const API_BASE = "http://localhost:5000/api";

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = typeof window !== "undefined" ? localStorage.getItem("fintech.token") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const authApi = {
  login: async (email: string, password?: string, name?: string): Promise<AuthUser> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Login failed");
    }
    return res.json();
  },
  register: async (name: string, email: string, password?: string): Promise<AuthUser> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Registration failed");
    }
    return res.json();
  },
};

export const applicationsApi = {
  list: async (): Promise<LoanApplication[]> => {
    const res = await fetch(`${API_BASE}/loans/history`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to fetch applications");
    }
    const data = await res.json();
    return data.map((app: any) => ({
      ...app,
      id: app.id || app._id,
    }));
  },
  create: async (app: Omit<LoanApplication, "id" | "createdAt" | "riskScore" | "riskLevel" | "status" | "applicantName" | "email">): Promise<LoanApplication> => {
    const res = await fetch(`${API_BASE}/loans/apply`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(app),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to create application");
    }
    const data = await res.json();
    return {
      ...data,
      id: data.id || data._id,
    };
  },
  updateStatus: async (id: string, status: AppStatus): Promise<{ id: string; status: AppStatus }> => {
    const res = await fetch(`${API_BASE}/loans/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to update status");
    }
    const data = await res.json();
    return {
      id: data.id || data._id || id,
      status: data.status,
    };
  },
};
