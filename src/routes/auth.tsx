import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Banknote, LineChart, ShieldCheck, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { authApi } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Sentinel Credit" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { login, role } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("Avery Park");
  const [email, setEmail] = useState("avery@sentinel.demo");
  const [password, setPassword] = useState("demopass");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = mode === "login" ? await authApi.login(email, password, name) : await authApi.register(name, email, password);
      login(u);
      navigate({ to: role === "admin" ? "/admin" : "/dashboard" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Sentinel Credit</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Risk Platform v4.2</div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to manage applications and risk assessments." : "Join Sentinel to assess credit risk in seconds."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "register" && (
              <Field label="Full name">
                <input value={name} onChange={(e) => setName(e.target.value)} required className="auth-input" placeholder="Jane Doe" />
              </Field>
            )}
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" placeholder="you@company.com" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="auth-input pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "New to Sentinel?" : "Already registered?"}{" "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-medium text-primary hover:underline">
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <style>{`
            .auth-input { width: 100%; border-radius: 0.5rem; border: 1px solid var(--color-border); background: var(--color-card); padding: 0.625rem 0.875rem; font-size: 0.875rem; color: var(--color-foreground); outline: none; transition: border-color .15s, box-shadow .15s; }
            .auth-input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 22%, transparent); }
          `}</style>
        </div>
      </div>

      {/* Graphic side */}
      <div className="relative hidden gradient-hero lg:block">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 25% 20%, rgba(255,255,255,.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.2), transparent 45%)" }} />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> SOC 2 Type II · ISO 27001
          </div>

          <div>
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
              Decision credit risk in seconds, not days.
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/75">
              Sentinel scores 14 risk factors across income, tenure, debt and credit history — so your underwriters focus on the edge cases.
            </p>

            {/* Mock chart card */}
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Approval rate" value="74.2%" delta="+3.1%" />
              <StatCard icon={<LineChart className="h-4 w-4" />} label="Avg. risk score" value="38.6" delta="-1.4" good />
              <div className="col-span-2 rounded-xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-white/70">Portfolio risk distribution</span>
                  <span className="font-medium">Q2 2026</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-emerald-300" style={{ width: "52%" }} />
                  <div className="h-full bg-amber-300" style={{ width: "31%" }} />
                  <div className="h-full bg-rose-300" style={{ width: "17%" }} />
                </div>
                <div className="mt-3 flex justify-between text-[11px] text-white/70">
                  <span>Low 52%</span><span>Medium 31%</span><span>High 17%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/60">© 2026 Sentinel Credit Systems</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function StatCard({ icon, label, value, delta, good }: { icon: React.ReactNode; label: string; value: string; delta: string; good?: boolean }) {
  return (
    <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
      <div className="flex items-center justify-between text-white/70">
        <span className="text-xs">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className={`mt-1 text-[11px] ${good ? "text-emerald-200" : "text-emerald-200"}`}>{delta} vs last quarter</div>
    </div>
  );
}
