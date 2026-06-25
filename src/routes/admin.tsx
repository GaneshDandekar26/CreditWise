import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, RiskBadge, StatusBadge } from "@/components/AppShell";
import { useStore, type AppStatus } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { Search, Check, X, CircleDollarSign, FileStack, ShieldAlert, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("fintech.user")) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Admin — Sentinel Credit" }] }),
  component: AdminPage,
});

const statusFilters: ("All" | AppStatus)[] = ["All", "Pending", "Approved", "Rejected"];

function AdminPage() {
  const { applications, updateStatus } = useStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("All");

  const metrics = useMemo(() => {
    const total = applications.length;
    const approved = applications.filter((a) => a.status === "Approved");
    const volume = approved.reduce((s, a) => s + a.loanAmount, 0);
    const avgRisk = applications.reduce((s, a) => s + a.riskScore, 0) / Math.max(total, 1);
    const pending = applications.filter((a) => a.status === "Pending").length;
    return { total, volume, avgRisk, pending };
  }, [applications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) => {
      if (statusFilter !== "All" && a.status !== statusFilter) return false;
      if (!q) return true;
      return a.applicantName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    });
  }, [applications, query, statusFilter]);

  return (
    <AppShell>
      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<FileStack className="h-4 w-4" />} label="Total applications" value={String(metrics.total)} sub={`${metrics.pending} pending review`} />
        <Metric icon={<CircleDollarSign className="h-4 w-4" />} label="Approved volume" value={fmt(metrics.volume)} sub="Lifetime disbursed" tone="success" />
        <Metric icon={<ShieldAlert className="h-4 w-4" />} label="Average risk score" value={metrics.avgRisk.toFixed(1)} sub="Lower is safer" tone={metrics.avgRisk > 60 ? "danger" : metrics.avgRisk > 40 ? "warn" : "success"} />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Approval rate" value={`${Math.round((applications.filter((a) => a.status === "Approved").length / Math.max(metrics.total, 1)) * 100)}%`} sub="All-time" />
      </section>

      {/* Filters */}
      <section className="mt-8 card-elevated">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by applicant name or email…"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-card text-muted-foreground ring-border hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left">Applicant</th>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Risk score</th>
                <th className="px-6 py-3 text-left">Risk level</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-6 py-3">
                    <div className="font-medium">{a.applicantName}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{a.id}</td>
                  <td className="px-6 py-3 text-right">{fmt(a.loanAmount)}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{a.riskScore}</td>
                  <td className="px-6 py-3"><RiskBadge level={a.riskLevel} /></td>
                  <td className="px-6 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateStatus(a.id, "Approved")}
                        disabled={a.status === "Approved"}
                        className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2.5 py-1 text-xs font-medium text-success ring-1 ring-success/30 transition-colors hover:bg-success/25 disabled:opacity-40"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus(a.id, "Rejected")}
                        disabled={a.status === "Rejected"}
                        className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive ring-1 ring-destructive/30 transition-colors hover:bg-destructive/25 disabled:opacity-40"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">No applications match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone?: "success" | "danger" | "warn" }) {
  const toneCls =
    tone === "success" ? "text-success" : tone === "danger" ? "text-destructive" : tone === "warn" ? "text-warning-foreground" : "text-foreground";
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-widest">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${toneCls}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
