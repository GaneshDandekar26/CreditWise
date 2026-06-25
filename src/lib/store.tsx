import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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
  name: string;
  email: string;
}

interface Store {
  user: AuthUser | null;
  role: Role;
  applications: LoanApplication[];
  login: (u: AuthUser) => void;
  logout: () => void;
  setRole: (r: Role) => void;
  addApplication: (a: Omit<LoanApplication, "id" | "createdAt" | "riskScore" | "riskLevel" | "status" | "applicantName" | "email"> & { applicantName?: string; email?: string }) => LoanApplication;
  updateStatus: (id: string, status: AppStatus) => void;
}

const StoreCtx = createContext<Store | null>(null);

function computeRisk(a: { creditScore: number; monthlyIncome: number; loanAmount: number; tenureMonths: number; existingDebt: number; employmentType: EmploymentType }) {
  const dti = (a.existingDebt + a.loanAmount / a.tenureMonths) / Math.max(a.monthlyIncome, 1);
  const empFactor = a.employmentType === "Permanent" ? 0 : a.employmentType === "Contract" ? 8 : 14;
  const credit = 850 - a.creditScore; // higher = riskier
  const raw = credit * 0.12 + dti * 90 + empFactor;
  const score = Math.min(100, Math.max(1, Math.round(raw)));
  const level: RiskLevel = score < 35 ? "Low" : score < 65 ? "Medium" : "High";
  return { score, level };
}

const seed: LoanApplication[] = [
  { id: "APP-1042", applicantName: "Aarav Mehta", email: "aarav@northwind.co", monthlyIncome: 8500, employmentType: "Permanent", creditScore: 760, loanAmount: 45000, tenureMonths: 60, existingDebt: 600, riskScore: 22, riskLevel: "Low", status: "Approved", createdAt: "2025-06-14" },
  { id: "APP-1043", applicantName: "Priya Shah", email: "priya@vanta.io", monthlyIncome: 5200, employmentType: "Contract", creditScore: 690, loanAmount: 30000, tenureMonths: 48, existingDebt: 1100, riskScore: 54, riskLevel: "Medium", status: "Pending", createdAt: "2025-06-15" },
  { id: "APP-1044", applicantName: "Liam O'Connor", email: "liam@oaktree.com", monthlyIncome: 4100, employmentType: "Self-employed", creditScore: 610, loanAmount: 28000, tenureMonths: 36, existingDebt: 1800, riskScore: 82, riskLevel: "High", status: "Rejected", createdAt: "2025-06-17" },
  { id: "APP-1045", applicantName: "Sofia Rivera", email: "sofia@helio.ai", monthlyIncome: 11200, employmentType: "Permanent", creditScore: 805, loanAmount: 120000, tenureMonths: 84, existingDebt: 0, riskScore: 14, riskLevel: "Low", status: "Approved", createdAt: "2025-06-18" },
  { id: "APP-1046", applicantName: "Noah Becker", email: "noah@kite.eu", monthlyIncome: 6700, employmentType: "Permanent", creditScore: 720, loanAmount: 55000, tenureMonths: 60, existingDebt: 900, riskScore: 38, riskLevel: "Medium", status: "Pending", createdAt: "2025-06-19" },
  { id: "APP-1047", applicantName: "Mei Tanaka", email: "mei@orchid.jp", monthlyIncome: 9300, employmentType: "Contract", creditScore: 745, loanAmount: 75000, tenureMonths: 72, existingDebt: 400, riskScore: 31, riskLevel: "Low", status: "Approved", createdAt: "2025-06-20" },
  { id: "APP-1048", applicantName: "Diego Alvarez", email: "diego@cobalt.mx", monthlyIncome: 3600, employmentType: "Self-employed", creditScore: 640, loanAmount: 22000, tenureMonths: 36, existingDebt: 1500, riskScore: 76, riskLevel: "High", status: "Rejected", createdAt: "2025-06-21" },
  { id: "APP-1049", applicantName: "Yara Haddad", email: "yara@silvercap.com", monthlyIncome: 7800, employmentType: "Permanent", creditScore: 700, loanAmount: 40000, tenureMonths: 48, existingDebt: 700, riskScore: 41, riskLevel: "Medium", status: "Pending", createdAt: "2025-06-22" },
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role>("customer");
  const [applications, setApplications] = useState<LoanApplication[]>(seed);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("fintech.user") : null;
      if (raw) setUser(JSON.parse(raw));
      const r = typeof window !== "undefined" ? localStorage.getItem("fintech.role") : null;
      if (r === "admin" || r === "customer") setRole(r);
    } catch {}
  }, []);

  const value = useMemo<Store>(() => ({
    user,
    role,
    applications,
    login: (u) => {
      setUser(u);
      try { localStorage.setItem("fintech.user", JSON.stringify(u)); } catch {}
    },
    logout: () => {
      setUser(null);
      try { localStorage.removeItem("fintech.user"); } catch {}
    },
    setRole: (r) => {
      setRole(r);
      try { localStorage.setItem("fintech.role", r); } catch {}
    },
    addApplication: (a) => {
      const { score, level } = computeRisk(a);
      const id = `APP-${1050 + applications.length}`;
      const app: LoanApplication = {
        id,
        applicantName: a.applicantName || user?.name || "You",
        email: a.email || user?.email || "you@example.com",
        monthlyIncome: a.monthlyIncome,
        employmentType: a.employmentType,
        creditScore: a.creditScore,
        loanAmount: a.loanAmount,
        tenureMonths: a.tenureMonths,
        existingDebt: a.existingDebt,
        riskScore: score,
        riskLevel: level,
        status: "Pending",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setApplications((prev) => [app, ...prev]);
      return app;
    },
    updateStatus: (id, status) => {
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    },
  }), [user, role, applications]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
