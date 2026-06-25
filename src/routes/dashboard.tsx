import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, RiskBadge, StatusBadge } from "@/components/AppShell";
import { useStore, type EmploymentType } from "@/lib/store";
import { fmt } from "@/lib/finance";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Wallet, Briefcase, Gauge } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("fintech.user")) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Customer Dashboard — Sentinel Credit" }] }),
  component: CustomerDashboard,
});

const steps = [
  { id: 1, label: "Income", icon: Wallet },
  { id: 2, label: "Employment", icon: Briefcase },
  { id: 3, label: "Loan", icon: FileText },
  { id: 4, label: "Review", icon: Gauge },
];

function CustomerDashboard() {
  const { applications, addApplication, user } = useStore();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [form, setForm] = useState({
    monthlyIncome: 7500,
    employmentType: "Permanent" as EmploymentType,
    creditScore: 720,
    loanAmount: 35000,
    tenureMonths: 60,
    existingDebt: 500,
  });

  const myApps = useMemo(
    () => applications.filter((a) => a.email === user?.email || a.applicantName === user?.name).concat(
      applications.filter((a) => a.email !== user?.email && a.applicantName !== user?.name).slice(0, 2),
    ),
    [applications, user],
  );

  function next() { setStep((s) => Math.min(4, s + 1)); }
  function prev() { setStep((s) => Math.max(1, s - 1)); }

  function submit() {
    const created = addApplication(form);
    setSubmitted(created.id);
    setStep(1);
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="card-elevated p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">New loan application</h2>
                <p className="text-sm text-muted-foreground">Tell us about your finances. Decision in under 60 seconds.</p>
              </div>
              <div className="text-xs text-muted-foreground">Step {step} of 4</div>
            </div>

            {/* Stepper */}
            <div className="mb-8 flex items-center gap-2">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const done = s.id < step;
                const current = s.id === step;
                return (
                  <div key={s.id} className="flex flex-1 items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      done ? "bg-success text-success-foreground" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="hidden text-xs sm:block">
                      <div className={current ? "font-medium" : "text-muted-foreground"}>{s.label}</div>
                    </div>
                    {i < steps.length - 1 && <div className={`mx-1 h-px flex-1 ${done ? "bg-success" : "bg-border"}`} />}
                  </div>
                );
              })}
            </div>

            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <NumField label="Monthly income (USD)" value={form.monthlyIncome} onChange={(v) => setForm({ ...form, monthlyIncome: v })} />
                <NumField label="Existing monthly debt" value={form.existingDebt} onChange={(v) => setForm({ ...form, existingDebt: v })} />
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>Employment type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Permanent", "Contract", "Self-employed"] as EmploymentType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, employmentType: t })}
                        className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                          form.employmentType === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <NumField label="Credit score (300–850)" value={form.creditScore} min={300} max={850} onChange={(v) => setForm({ ...form, creditScore: v })} />
              </div>
            )}
            {step === 3 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <NumField label="Loan amount (USD)" value={form.loanAmount} onChange={(v) => setForm({ ...form, loanAmount: v })} />
                <NumField label="Tenure (months)" value={form.tenureMonths} min={6} max={120} onChange={(v) => setForm({ ...form, tenureMonths: v })} />
              </div>
            )}
            {step === 4 && (
              <div className="rounded-md border border-border bg-muted/40 p-5 text-sm">
                <h3 className="mb-3 font-semibold">Review your application</h3>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <Review k="Monthly income" v={fmt(form.monthlyIncome)} />
                  <Review k="Existing debt" v={fmt(form.existingDebt)} />
                  <Review k="Employment" v={form.employmentType} />
                  <Review k="Credit score" v={String(form.creditScore)} />
                  <Review k="Loan amount" v={fmt(form.loanAmount)} />
                  <Review k="Tenure" v={`${form.tenureMonths} months`} />
                </dl>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button onClick={prev} disabled={step === 1} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < 4 ? (
                <button onClick={next} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={submit} className="inline-flex items-center gap-1.5 rounded-md bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:bg-success/90">
                  Submit application <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {submitted && (
              <div className="mt-6 rounded-md border border-success/30 bg-success/10 p-4 text-sm text-success">
                Application <strong>{submitted}</strong> submitted. We&apos;ll notify you once underwriting reviews it.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card-elevated p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Active credit line</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{fmt(45000)}</div>
            <div className="mt-1 text-xs text-muted-foreground">Utilization 38% · APR 7.2%</div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: "38%" }} />
            </div>
          </div>
          <div className="card-elevated p-6">
            <div className="text-sm font-semibold">Tips to boost approval</div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>· Keep utilization under 30% of available credit.</li>
              <li>· Avoid opening new accounts 90 days before applying.</li>
              <li>· Permanent employment improves your risk profile.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* History */}
      <section className="mt-8 card-elevated">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-lg font-semibold">Application history</h2>
            <p className="text-xs text-muted-foreground">Your recent submissions and decisions.</p>
          </div>
          <span className="text-xs text-muted-foreground">{myApps.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Tenure</th>
                <th className="px-6 py-3 text-left">Risk</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myApps.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-6 py-3 font-mono text-xs">{a.id}</td>
                  <td className="px-6 py-3 text-muted-foreground">{a.createdAt}</td>
                  <td className="px-6 py-3 text-right">{fmt(a.loanAmount)}</td>
                  <td className="px-6 py-3 text-right">{a.tenureMonths} mo</td>
                  <td className="px-6 py-3"><RiskBadge level={a.riskLevel} /></td>
                  <td className="px-6 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-xs font-medium text-muted-foreground">{children}</div>;
}
function NumField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring"
      />
    </label>
  );
}
function Review({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </>
  );
}
