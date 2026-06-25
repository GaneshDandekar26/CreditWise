import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { calcEMI, fmt, fmt2 } from "@/lib/finance";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calculator } from "lucide-react";

export const Route = createFileRoute("/calculator")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("fintech.user")) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "EMI Calculator — Sentinel Credit" }] }),
  component: EmiPage,
});

function EmiPage() {
  const [amount, setAmount] = useState(50000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(60);

  const { emi, totalInterest, totalPayment } = useMemo(() => calcEMI(amount, rate, tenure), [amount, rate, tenure]);

  // Amortization (yearly) for chart
  const schedule = useMemo(() => {
    const r = rate / 100 / 12;
    let balance = amount;
    const points: { month: number; principal: number; interest: number; balance: number }[] = [];
    let cumPrincipal = 0;
    let cumInterest = 0;
    for (let m = 1; m <= tenure; m++) {
      const interest = balance * r;
      const principal = emi - interest;
      cumPrincipal += principal;
      cumInterest += interest;
      balance = Math.max(0, balance - principal);
      if (m % Math.max(1, Math.round(tenure / 12)) === 0 || m === tenure) {
        points.push({
          month: m,
          principal: Math.round(cumPrincipal),
          interest: Math.round(cumInterest),
          balance: Math.round(balance),
        });
      }
    }
    return points;
  }, [amount, rate, tenure, emi]);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card-elevated p-6 lg:col-span-3">
          <div className="mb-1 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">EMI Calculator</h2>
          </div>
          <p className="text-sm text-muted-foreground">Estimate your monthly installment and total cost of credit.</p>

          <div className="mt-8 space-y-7">
            <SliderRow
              label="Loan amount"
              value={amount}
              display={fmt(amount)}
              min={1000}
              max={500000}
              step={1000}
              onChange={setAmount}
            />
            <SliderRow
              label="Interest rate (APR)"
              value={rate}
              display={`${rate.toFixed(2)} %`}
              min={1}
              max={24}
              step={0.1}
              onChange={setRate}
            />
            <SliderRow
              label="Tenure"
              value={tenure}
              display={`${tenure} months · ${(tenure / 12).toFixed(1)} yrs`}
              min={6}
              max={360}
              step={6}
              onChange={setTenure}
            />
          </div>

          <div className="mt-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={schedule}>
                <defs>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" tickFormatter={(v) => `${v}m`} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} stroke="var(--color-border)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="principal" name="Cumulative principal" stroke="var(--color-chart-1)" fill="url(#gp)" strokeWidth={2} />
                <Area type="monotone" dataKey="interest" name="Cumulative interest" stroke="var(--color-chart-4)" fill="url(#gi)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <aside className="space-y-4 lg:col-span-2">
          <div className="card-elevated overflow-hidden">
            <div className="gradient-hero p-6 text-white">
              <div className="text-xs uppercase tracking-widest text-white/70">Monthly EMI</div>
              <div className="mt-2 text-4xl font-semibold tracking-tight">{fmt2(emi)}</div>
              <div className="mt-1 text-xs text-white/70">over {tenure} months at {rate.toFixed(2)}% APR</div>
            </div>
            <div className="divide-y divide-border">
              <Row label="Principal borrowed" value={fmt(amount)} />
              <Row label="Total interest payable" value={fmt2(totalInterest)} accent="text-destructive" />
              <Row label="Total payment" value={fmt2(totalPayment)} accent="text-success" />
              <Row label="Interest as % of total" value={`${((totalInterest / totalPayment) * 100).toFixed(1)}%`} />
            </div>
          </div>
          <div className="card-elevated p-6">
            <div className="text-sm font-semibold">Formula</div>
            <code className="mt-2 block rounded-md bg-muted px-3 py-2 text-xs">
              EMI = P · r · (1+r)<sup>n</sup> / ((1+r)<sup>n</sup> − 1)
            </code>
            <p className="mt-3 text-xs text-muted-foreground">
              where <strong>P</strong> is principal, <strong>r</strong> is monthly interest rate, and <strong>n</strong> is tenure in months.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function SliderRow({ label, value, display, min, max, step, onChange }: { label: string; value: number; display: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="emi-slider w-full"
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{typeof min === "number" && min >= 1000 ? `${min / 1000}k` : min}</span>
        <span>{typeof max === "number" && max >= 1000 ? `${max / 1000}k` : max}</span>
      </div>
      <style>{`
        .emi-slider { -webkit-appearance: none; height: 6px; border-radius: 999px; background: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((value - min) / (max - min)) * 100}%, var(--color-muted) ${((value - min) / (max - min)) * 100}%, var(--color-muted) 100%); outline: none; }
        .emi-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 999px; background: var(--color-primary-foreground); border: 3px solid var(--color-primary); cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
        .emi-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 999px; background: var(--color-primary-foreground); border: 3px solid var(--color-primary); cursor: pointer; }
      `}</style>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${accent || "text-foreground"}`}>{value}</span>
    </div>
  );
}
