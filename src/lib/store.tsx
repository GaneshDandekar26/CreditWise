import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applicationsApi } from "./api";

export type Role = "customer" | "admin";
export type RiskLevel = "Low" | "Medium" | "High";
export type AppStatus = "Approved" | "Rejected" | "Pending";
export type EmploymentType = "Permanent" | "Contract" | "Self-employed";

export interface LoanApplication {
  id: string;
  applicantName: string;
  email: string;
  monthlyIncome: number;
  employmentType: EmploymentType;
  creditScore: number;
  loanAmount: number;
  tenureMonths: number;
  existingDebt: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: AppStatus;
  createdAt: string;
}

export interface AuthUser {
  _id?: string;
  name: string;
  email: string;
  role?: Role;
  token?: string;
}

interface Store {
  user: AuthUser | null;
  role: Role;
  applications: LoanApplication[];
  login: (u: AuthUser) => void;
  logout: () => void;
  setRole: (r: Role) => void;
  addApplication: (a: Omit<LoanApplication, "id" | "createdAt" | "riskScore" | "riskLevel" | "status" | "applicantName" | "email"> & { applicantName?: string; email?: string }) => Promise<LoanApplication>;
  updateStatus: (id: string, status: AppStatus) => Promise<void>;
}

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role>("customer");
  const [applications, setApplications] = useState<LoanApplication[]>([]);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("fintech.user") : null;
      if (raw) setUser(JSON.parse(raw));
      const r = typeof window !== "undefined" ? localStorage.getItem("fintech.role") : null;
      if (r === "admin" || r === "customer") setRole(r);
    } catch {}
  }, []);

  // Sync applications from the backend when the user changes
  useEffect(() => {
    if (!user) {
      setApplications([]);
      return;
    }

    applicationsApi.list()
      .then((data) => {
        setApplications(data);
      })
      .catch((err) => {
        console.error("Failed to load applications from backend:", err);
      });
  }, [user]);

  const value = useMemo<Store>(() => ({
    user,
    role,
    applications,
    login: (u) => {
      setUser(u);
      if (u.role) setRole(u.role);
      try {
        localStorage.setItem("fintech.user", JSON.stringify(u));
        if (u.role) localStorage.setItem("fintech.role", u.role);
        if (u.token) localStorage.setItem("fintech.token", u.token);
      } catch {}
    },
    logout: () => {
      setUser(null);
      setRole("customer");
      try {
        localStorage.removeItem("fintech.user");
        localStorage.removeItem("fintech.role");
        localStorage.removeItem("fintech.token");
      } catch {}
    },
    setRole: (r) => {
      setRole(r);
      try { localStorage.setItem("fintech.role", r); } catch {}
    },
    addApplication: async (a) => {
      const created = await applicationsApi.create(a);
      setApplications((prev) => [created, ...prev]);
      return created;
    },
    updateStatus: async (id, status) => {
      try {
        const result = await applicationsApi.updateStatus(id, status);
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: result.status } : a))
        );
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Failed to update application status");
      }
    },
  }), [user, role, applications]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
