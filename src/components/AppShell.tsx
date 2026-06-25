import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShieldCheck, BarChart3, Calculator, LogOut, Banknote, Users } from "lucide-react";
import { useStore, type Role } from "@/lib/store";
import { type ReactNode } from "react";

const customerNav = [
  { to: "/dashboard", label: "My Loans", icon: LayoutDashboard },
  { to: "/calculator", label: "EMI Calculator", icon: Calculator },
];
const adminNav = [
  { to: "/admin", label: "Applications", icon: ShieldCheck },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/calculator", label: "EMI Calculator", icon: Calculator },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, setRole, logout } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = role === "admin" ? adminNav : customerNav;

  const onRoleChange = (r: Role) => {
    setRole(r);
    navigate({ to: r === "admin" ? "/admin" : "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/20 ring-1 ring-primary/40">
            <Banknote className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Sentinel Credit</div>
            <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Risk Platform</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-border/60 text-white"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-border/40 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>Logged in as {role}</span>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{role === "admin" ? "Underwriting" : "Customer"}</div>
            <div className="text-base font-semibold">{titleFor(pathname)}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border border-border bg-card p-0.5 text-xs">
              {(["customer", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`rounded-[5px] px-3 py-1.5 capitalize transition-colors ${
                    role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Simulate {r}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs sm:flex">
              <div className="h-7 w-7 rounded-full bg-primary/20 text-center text-[11px] font-semibold leading-7 text-primary">
                {(user?.name || "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="font-medium">{user?.name || "Guest"}</div>
                <div className="text-muted-foreground">{user?.email || "—"}</div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/auth" });
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function titleFor(p: string) {
  if (p.startsWith("/admin")) return "Application Review";
  if (p.startsWith("/analytics")) return "Portfolio Analytics";
  if (p.startsWith("/calculator")) return "EMI Calculator";
  if (p.startsWith("/dashboard")) return "Customer Dashboard";
  return "Sentinel Credit";
}

export function StatusBadge({ status }: { status: "Approved" | "Rejected" | "Pending" }) {
  const cls =
    status === "Approved"
      ? "bg-success/15 text-success ring-success/30"
      : status === "Rejected"
        ? "bg-destructive/15 text-destructive ring-destructive/30"
        : "bg-warning/20 text-warning-foreground ring-warning/40";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>
      {status}
    </span>
  );
}

export function RiskBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const cls =
    level === "Low"
      ? "bg-success/15 text-success ring-success/30"
      : level === "Medium"
        ? "bg-warning/20 text-warning-foreground ring-warning/40"
        : "bg-destructive/15 text-destructive ring-destructive/30";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level} Risk
    </span>
  );
}
