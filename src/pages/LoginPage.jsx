import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import ThemeToggle from "../components/theme/ThemeToggle";

const categorySplit = [
  { label: "Food", value: 38, color: "#818cf8" },
  { label: "Transport", value: 27, color: "#a5b4fc" },
  { label: "Utilities", value: 21, color: "#c7d2fe" },
  { label: "Other", value: 14, color: "#e0e7ff" },
];

const recentRows = [
  { remark: "Worker payment", category: "Food", date: "3 Jul", amount: "-₹1,240", tone: "text-slate-900" },
  { remark: "Client payout", category: "Freelance", date: "2 Jul", amount: "+₹18,500", tone: "text-success" },
  { remark: "Electricity bill", category: "Utilities", date: "1 Jul", amount: "-₹2,100", tone: "text-slate-900" },
];

function donutGradient(segments) {
  let acc = 0;
  const stops = segments.map((s) => {
    const start = acc;
    acc += s.value;
    return `${s.color} ${start}% ${acc}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password, remember);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef0f6] p-4 dark:bg-background">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-card shadow-2xl lg:grid-cols-2">
        {/* Form panel */}
        <div className="flex flex-col justify-between px-8 py-10 sm:px-14 sm:py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Vetri Digitals" className="h-8 w-8 object-contain" />
              <span className="font-display text-lg font-semibold tracking-tight">
                Vetri Digitals
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div className="mx-auto w-full max-w-sm animate-fade-up py-10">
            <h1 className="font-display text-4xl font-bold tracking-tight">
              {isRegister ? "Create account" : "Welcome back"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {isRegister
                ? "Fill in your details to start tracking expenses."
                : "Enter your email and password to access your account."}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isRegister && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    className="h-12 rounded-xl"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12 rounded-xl"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="h-12 rounded-xl pr-11"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isRegister && (
                <label className="flex select-none items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                  />
                  Remember me
                </label>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full rounded-xl bg-brand text-white hover:bg-brand-dark"
              >
                {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
              </Button>
            </form>

            {/* <p className="mt-6 text-center text-sm text-muted-foreground">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsRegister((p) => !p)}
                className="font-medium text-brand hover:underline"
                type="button"
              >
                {isRegister ? "Log in" : "Register now"}
              </button>
            </p> */}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Copyright © {new Date().getFullYear()} Vetri Digitals.
          </p>
        </div>

        {/* Showcase panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-light via-brand to-brand-dark p-12 lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative max-w-md">
            <h2 className="font-display text-4xl font-bold leading-[1.15] text-white">
              Take control of every rupee you spend.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Log in to see today's spending, monthly trends, and shared team
              expenses in one dashboard.
            </p>
          </div>

          <div className="relative mt-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-xl">
                <p className="text-xs text-slate-500">This month</p>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900">
                  ₹42,850
                </p>
                <span className="mt-2 inline-block rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                  ↑ 12% from last month
                </span>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-xl">
                <p className="text-xs text-slate-500">Avg. daily spend</p>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900">
                  ₹1,428
                </p>
                <svg viewBox="0 0 100 30" className="mt-2 h-8 w-full text-brand">
                  <polyline
                    points="0,22 15,18 30,24 45,10 60,16 75,6 90,12 100,4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xl">
              <div
                className="h-16 w-16 shrink-0 rounded-full"
                style={{ background: donutGradient(categorySplit) }}
              />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Category split</p>
                <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                  {categorySplit.map((c) => (
                    <div key={c.label} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 shadow-xl">
              <p className="mb-2 text-xs text-slate-500">Recent transactions</p>
              <div className="space-y-2">
                {recentRows.map((r) => (
                  <div key={r.remark} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{r.remark}</p>
                      <p className="text-xs text-slate-500">
                        {r.category} · {r.date}
                      </p>
                    </div>
                    <span className={`font-display text-sm font-semibold tabular-nums ${r.tone}`}>
                      {r.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
