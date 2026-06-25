import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";

export const Route = createFileRoute("/analytics")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("fintech.user")) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Analytics — Sentinel Credit" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { applications } = useStore();

  const riskDist = useMemo(() => {
    const m = { Low: 0, Medium: 0, High: 0 };
    applications.forEach((a) => { m[a.riskLevel]++; });
    return [
      { name: "Low", value: m.Low, color: "var(--color-success)" },
      { name: "Medium", value: m.Medium, color: "var(--color-warning)" },
      { name: "High", value: m.High, color: "var(--color-destructive)" },
    ];
  }, [applications]);

  const loanAmountBuckets = useMemo(() => {
    const buckets = [
      { name: "<25k", min: 0, max: 25000, requested: 0, approved: 0 },
      { name: "25–50k", min: 25000, max: 50000, requested: 0, approved: 0 },
      { name: "50–75k", min: 50000, max: 75000, requested: 0, approved: 0 },
      { name: "75–100k", min: 75000, max: 100000, requested: 0, approved: 0 },
      { name: "100k+", min: 100000, max: Infinity, requested: 0, approved: 0 },
    ];
    applications.forEach((a) => {
      const b = buckets.find((b) => a.loanAmount >= b.min && a.loanAmount < b.max);
      if (!b) return;
      b.requested += a.loanAmount;
      if (a.status === "Approved") b.approved += a.loanAmount;
    });
    return buckets;
  }, [applications]);

  const approvalRate = useMemo(() => {
    // approval rate per risk level
    const groups = ["Low", "Medium", "High"] as const;
    return groups.map((g) => {
      const subset = applications.filter((a) => a.riskLevel === g);
      const approved = subset.filter((a) => a.status === "Approved").length;
      return { name: g, rate: subset.length ? Math.round((approved / subset.length) * 100) : 0 };
    });
  }, [applications]);

  const trend = useMemo(() => {
    // synthetic 6-month trend
    return [
      { month: "Jan", apps: 42, approvals: 28 },
      { month: "Feb", apps: 51, approvals: 33 },
      { month: "Mar", apps: 58, approvals: 39 },
      { month: "Apr", apps: 64, approvals: 47 },
      { month: "May", apps: 72, approvals: 52 },
      { month: "Jun", apps: 81, approvals: 61 },
    ];
  }, []);

  const totalApproved = applications.filter((a) => a.status === "Approved").reduce((s, a) => s + a.loanAmount, 0);
  const totalRequested = applications.reduce((s, a) => s + a.loanAmount, 0);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-elevated p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold">Risk distribution</h3>
          <p className="text-xs text-muted-foreground">Composition of the active portfolio.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {riskDist.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold">Loan amount analysis</h3>
              <p className="text-xs text-muted-foreground">Requested vs approved volume by bucket.</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Approved / Requested</div>
              <div className="text-sm font-semibold">{fmt(totalApproved)} / {fmt(totalRequested)}</div>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanAmountBuckets} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="requested" name="Requested" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold">Approval rate by risk</h3>
          <p className="text-xs text-muted-foreground">% of applications approved per band.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approvalRate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {approvalRate.map((d) => (
                    <Cell key={d.name} fill={d.name === "Low" ? "var(--color-success)" : d.name === "Medium" ? "var(--color-warning)" : "var(--color-destructive)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold">Volume trend</h3>
          <p className="text-xs text-muted-foreground">Applications received vs approved (last 6 months).</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="apps" name="Applications" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="approvals" name="Approvals" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-popover-foreground)",
};
