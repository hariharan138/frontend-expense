import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  Bell,
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  CalendarCheck,
  CheckCircle2,
  Link2,
  Ban,
  StickyNote,
  IndianRupee,
} from "lucide-react";
import axiosInstance from "../api/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { cn } from "../lib/utils";

const STATUS_META = {
  paid: {
    label: "Paid",
    className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  },
  under_paid: {
    label: "Under Paid",
    className: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  },
  over_paid: {
    label: "Over Paid",
    className: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-400",
  },
  overdue: {
    label: "Overdue",
    className: "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-400",
  },
  no_transaction: {
    label: "No Transaction",
    className: "bg-muted text-muted-foreground border-border",
  },
  ignored: {
    label: "Ignored",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const CARD_TONES = {
  mint: { edge: "bg-emerald-500", chip: "bg-emerald-500/15 text-emerald-600", value: "text-emerald-600 dark:text-emerald-400" },
  coral: { edge: "bg-rose-500", chip: "bg-rose-500/15 text-rose-600", value: "text-rose-600 dark:text-rose-400" },
  lilac: { edge: "bg-violet-500", chip: "bg-violet-500/15 text-violet-600", value: "text-violet-600 dark:text-violet-400" },
  cream: { edge: "bg-amber-500", chip: "bg-amber-500/15 text-amber-600", value: "text-amber-600 dark:text-amber-400" },
  sky: { edge: "bg-sky-500", chip: "bg-sky-500/15 text-sky-600", value: "text-sky-600 dark:text-sky-400" },
};

const EMPTY_FORM = {
  employeeName: "",
  remark: "",
  startDate: format(new Date(), "yyyy-MM-dd"),
  expectedAmount: "",
  frequencyType: "days",
  frequencyValue: "7",
  reminderDays: "1",
  active: true,
};

function inr(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return format(new Date(d), "dd MMM yyyy");
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.no_transaction;
  return (
    <Badge variant="outline" className={cn("font-medium", meta.className)}>
      {meta.label}
    </Badge>
  );
}

function StatCard({ title, value, icon: Icon, tone = "lilac", isCurrency = true, delay = 0 }) {
  const t = CARD_TONES[tone];
  return (
    <Card
      className="relative overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", t.edge)} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", t.chip)}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className={cn("font-display text-2xl font-semibold tracking-tight tabular-nums", t.value)}>
          {isCurrency ? inr(value) : value}
        </p>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, tone = "emerald" }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const colors = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", colors[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function PayrollPage() {
  const [data, setData] = useState({
    employees: [],
    dashboard: {},
    reminders: [],
    analytics: {},
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    frequency: "",
    startDate: "",
    endDate: "",
  });
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideCycle, setOverrideCycle] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    action: "mark_paid",
    expectedAmount: "",
    linkedTransaction: "",
    notes: "",
  });
  const [linkOptions, setLinkOptions] = useState([]);

  const fetchData = async () => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    ).toString();
    const { data: payload } = await axiosInstance.get(`/payroll?${params}`);
    setData(payload);
    if (payload.employees?.length) {
      setSelectedId((prev) =>
        prev && payload.employees.some((e) => e._id === prev)
          ? prev
          : payload.employees[0]._id
      );
    } else {
      setSelectedId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData()
      .catch((err) => alert(err?.response?.data?.message || "Failed to load payroll"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const employees = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    if (!q) return data.employees;
    return data.employees.filter((e) => e.employeeName.toLowerCase().includes(q));
  }, [data.employees, employeeQuery]);

  const selected = useMemo(
    () => employees.find((e) => e._id === selectedId) || data.employees.find((e) => e._id === selectedId) || null,
    [employees, data.employees, selectedId]
  );

  const historyRows = useMemo(() => {
    if (selected) return selected.cycles || [];
    return employees.flatMap((e) =>
      (e.cycles || []).map((c) => ({ ...c, employeeName: e.employeeName }))
    );
  }, [selected, employees]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setRuleOpen(true);
  };

  const openEdit = (emp) => {
    setEditingId(emp._id);
    setForm({
      employeeName: emp.employeeName,
      remark: emp.remark,
      startDate: format(new Date(emp.startDate), "yyyy-MM-dd"),
      expectedAmount: String(emp.expectedAmount),
      frequencyType: emp.frequencyType,
      frequencyValue: String(emp.frequencyValue || 7),
      reminderDays: String(emp.reminderDays || 1),
      active: emp.active !== false,
    });
    setRuleOpen(true);
  };

  const handleSaveRule = async () => {
    if (!form.employeeName.trim() || !form.remark.trim() || !form.expectedAmount) {
      alert("Employee name, remark and expected amount are required");
      return;
    }
    const body = {
      employeeName: form.employeeName.trim(),
      remark: form.remark.trim(),
      startDate: form.startDate,
      expectedAmount: Number(form.expectedAmount),
      frequencyType: form.frequencyType,
      frequencyValue: Number(form.frequencyValue) || 7,
      reminderDays: Number(form.reminderDays) || 1,
      active: form.active,
    };
    try {
      if (editingId) await axiosInstance.put(`/payroll/${editingId}`, body);
      else await axiosInstance.post("/payroll", body);
      setRuleOpen(false);
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this payroll rule?")) return;
    try {
      await axiosInstance.delete(`/payroll/${id}`);
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const openOverride = async (cycle) => {
    setOverrideCycle(cycle);
    setOverrideForm({
      action: "mark_paid",
      expectedAmount: String(cycle.expectedAmount || ""),
      linkedTransaction: cycle.transactionId || "",
      notes: cycle.notes || "",
    });
    try {
      const remark = selected?.remark || "";
      const { data: txs } = await axiosInstance.get(
        `/payroll/transactions/search?q=${encodeURIComponent(remark)}`
      );
      setLinkOptions(txs);
    } catch {
      setLinkOptions([]);
    }
    setOverrideOpen(true);
  };

  const handleOverride = async () => {
    if (!selected || !overrideCycle) return;
    const body = {
      dueDate: overrideCycle.dueKey || format(new Date(overrideCycle.dueDate), "yyyy-MM-dd"),
      action: overrideForm.action,
      notes: overrideForm.notes,
    };
    if (overrideForm.action === "adjust" || overrideForm.expectedAmount) {
      body.expectedAmount = Number(overrideForm.expectedAmount);
    }
    if (overrideForm.action === "link") {
      if (!overrideForm.linkedTransaction) {
        alert("Select a transaction to link");
        return;
      }
      body.linkedTransaction = overrideForm.linkedTransaction;
    }
    try {
      await axiosInstance.put(`/payroll/${selected._id}/override`, body);
      setOverrideOpen(false);
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Override failed");
    }
  };

  const dash = data.dashboard || {};
  const analytics = data.analytics || {};

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Loading payroll…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Track recurring employee payments by matching transaction remarks.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add Payroll Rule
        </Button>
      </div>

      {/* Dashboard cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard title="Total Expected" value={dash.totalExpected || 0} icon={Wallet} tone="lilac" delay={0} />
        <StatCard title="Total Paid" value={dash.totalPaid || 0} icon={TrendingUp} tone="mint" delay={40} />
        <StatCard title="Pending Amount" value={dash.pendingAmount || 0} icon={TrendingDown} tone="coral" delay={80} />
        <StatCard title="Overpaid Amount" value={dash.overpaidAmount || 0} icon={IndianRupee} tone="sky" delay={120} />
        <StatCard
          title="Next Due Date"
          value={dash.nextDueDate ? fmtDate(dash.nextDueDate) : "—"}
          icon={CalendarClock}
          tone="cream"
          isCurrency={false}
          delay={160}
        />
        <StatCard
          title="Last Payment"
          value={dash.lastPaymentDate ? fmtDate(dash.lastPaymentDate) : "—"}
          icon={CalendarCheck}
          tone="mint"
          isCurrency={false}
          delay={200}
        />
      </div>

      {/* Filters + Reminders */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label>Employee</Label>
                <Input
                  placeholder="Search name…"
                  value={employeeQuery}
                  onChange={(e) => setEmployeeQuery(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="paid">Paid</option>
                  <option value="under_paid">Under Paid</option>
                  <option value="over_paid">Over Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="no_transaction">No Transaction</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={filters.frequency}
                  onChange={(e) => setFilters((f) => ({ ...f, frequency: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="days">Every X Days</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-amber-500" /> Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.reminders?.length ? (
              <ul className="max-h-40 space-y-2 overflow-y-auto">
                {data.reminders.slice(0, 8).map((r, i) => (
                  <li
                    key={`${r.ruleId}-${r.type}-${i}`}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      r.severity === "high"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                    )}
                  >
                    {r.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No reminders right now.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Success</span>
                <span className="font-semibold tabular-nums">{analytics.paymentSuccessPct ?? 0}%</span>
              </div>
              <ProgressBar value={analytics.paymentSuccessPct} tone="emerald" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Delay</p>
              <p className="font-display text-xl font-semibold tabular-nums">
                {analytics.averageDelay ?? 0} days
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Under / Over / Missed</p>
              <p className="font-display text-xl font-semibold tabular-nums">
                <span className="text-amber-600">{analytics.underpayments ?? 0}</span>
                {" / "}
                <span className="text-sky-600">{analytics.overpayments ?? 0}</span>
                {" / "}
                <span className="text-rose-600">{analytics.missedPayments ?? 0}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Paid vs Due</p>
              <p className="font-display text-xl font-semibold tabular-nums">
                {inr(analytics.totalPaid)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {inr(analytics.totalDue)}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee summary */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Employee Summary</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {employees.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payroll rules yet. Create one to start matching payments.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-3 font-medium">Employee</th>
                  <th className="pb-3 pr-3 font-medium">Remark</th>
                  <th className="pb-3 pr-3 font-medium">Frequency</th>
                  <th className="pb-3 pr-3 font-medium">Expected</th>
                  <th className="pb-3 pr-3 font-medium">Next Due</th>
                  <th className="pb-3 pr-3 font-medium">Status</th>
                  <th className="pb-3 pr-3 font-medium">Last Payment</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp._id}
                    onClick={() => setSelectedId(emp._id)}
                    className={cn(
                      "cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40",
                      selectedId === emp._id && "bg-muted/50"
                    )}
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{emp.employeeName}</span>
                        {!emp.active && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{emp.remark}</td>
                    <td className="py-3 pr-3">{emp.frequency}</td>
                    <td className="py-3 pr-3 tabular-nums">{inr(emp.expectedAmount)}</td>
                    <td className="py-3 pr-3">{fmtDate(emp.nextDue)}</td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="py-3 pr-3">{fmtDate(emp.lastPayment)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(emp)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-700"
                          onClick={() => handleDelete(emp._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Timeline + History */}
      {selected && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Payment Timeline — {selected.employeeName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0 pl-2">
                {(selected.cycles || []).slice(-12).map((c, idx, arr) => (
                  <div key={c.dueKey} className="relative flex gap-4 pb-6 last:pb-0">
                    {idx < arr.length - 1 && (
                      <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
                    )}
                    <span
                      className={cn(
                        "relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 bg-background",
                        c.status === "paid" && "border-emerald-500 bg-emerald-500",
                        c.status === "under_paid" && "border-amber-500 bg-amber-500",
                        c.status === "over_paid" && "border-sky-500 bg-sky-500",
                        c.status === "overdue" && "border-rose-500 bg-rose-500",
                        (c.status === "no_transaction" || c.status === "ignored") &&
                          "border-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{fmtDate(c.dueDate)}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expected {inr(c.expectedAmount)}
                        {c.actualAmount != null ? ` · Paid ${inr(c.actualAmount)}` : " · No Transaction"}
                      </p>
                      {c.notes && (
                        <p className="text-xs text-muted-foreground italic">{c.notes}</p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => openOverride(c)}
                      >
                        Manual override
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pr-2 font-medium">Due Date</th>
                    <th className="pb-3 pr-2 font-medium">Expected</th>
                    <th className="pb-3 pr-2 font-medium">Actual</th>
                    <th className="pb-3 pr-2 font-medium">Diff</th>
                    <th className="pb-3 pr-2 font-medium">Tx Date</th>
                    <th className="pb-3 pr-2 font-medium">Tx ID</th>
                    <th className="pb-3 pr-2 font-medium">Remark</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((c) => (
                    <tr key={`${c.dueKey}-${c.transactionId || "none"}`} className="border-b border-border/60">
                      <td className="py-2.5 pr-2">{fmtDate(c.dueDate)}</td>
                      <td className="py-2.5 pr-2 tabular-nums">{inr(c.expectedAmount)}</td>
                      <td className="py-2.5 pr-2 tabular-nums">
                        {c.actualAmount != null ? inr(c.actualAmount) : "—"}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 pr-2 tabular-nums",
                          c.difference > 0 && "text-sky-600",
                          c.difference < 0 && "text-amber-600"
                        )}
                      >
                        {c.difference != null
                          ? `${c.difference > 0 ? "+" : ""}${Number(c.difference).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-2">{fmtDate(c.transactionDate)}</td>
                      <td className="py-2.5 pr-2 font-mono text-xs text-muted-foreground">
                        {c.transactionId ? String(c.transactionId).slice(-8) : "—"}
                      </td>
                      <td className="py-2.5 pr-2 text-muted-foreground">{c.remark}</td>
                      <td className="py-2.5">
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create / Edit Rule Dialog */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Payroll Rule" : "New Payroll Rule"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Employee Name</Label>
              <Input
                placeholder="e.g. Test"
                value={form.employeeName}
                onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Transaction Remark</Label>
              <Input
                placeholder='e.g. Test paid'
                value={form.remark}
                onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Exact match against transaction remarks (case-insensitive).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expected Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="5600"
                  value={form.expectedAmount}
                  onChange={(e) => setForm((f) => ({ ...f, expectedAmount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.frequencyType}
                  onChange={(e) => setForm((f) => ({ ...f, frequencyType: e.target.value }))}
                >
                  <option value="days">Every X Days</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {(form.frequencyType === "days" || form.frequencyType === "custom") && (
                <div className="space-y-1.5">
                  <Label>Every (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.frequencyValue}
                    onChange={(e) => setForm((f) => ({ ...f, frequencyValue: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Remind before (days)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.reminderDays}
                  onChange={(e) => setForm((f) => ({ ...f, reminderDays: e.target.value }))}
                >
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Override Dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Override — {overrideCycle ? fmtDate(overrideCycle.dueDate) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Action</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={overrideForm.action}
                onChange={(e) => setOverrideForm((f) => ({ ...f, action: e.target.value }))}
              >
                <option value="mark_paid">Mark as Paid</option>
                <option value="link">Link another transaction</option>
                <option value="ignore">Ignore payment</option>
                <option value="adjust">Adjust expected amount</option>
                <option value="note">Add notes only</option>
                <option value="clear">Clear override</option>
              </select>
            </div>

            {(overrideForm.action === "adjust" || overrideForm.action === "mark_paid") && (
              <div className="space-y-1.5">
                <Label>Expected Amount (₹)</Label>
                <Input
                  type="number"
                  value={overrideForm.expectedAmount}
                  onChange={(e) =>
                    setOverrideForm((f) => ({ ...f, expectedAmount: e.target.value }))
                  }
                />
              </div>
            )}

            {overrideForm.action === "link" && (
              <div className="space-y-1.5">
                <Label>Transaction</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={overrideForm.linkedTransaction}
                  onChange={(e) =>
                    setOverrideForm((f) => ({ ...f, linkedTransaction: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  {linkOptions.map((tx) => (
                    <option key={tx._id} value={tx._id}>
                      {fmtDate(tx.date)} · {inr(tx.amount)} · {tx.remark}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {overrideForm.action !== "clear" && (
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input
                  placeholder="Optional note…"
                  value={overrideForm.notes}
                  onChange={(e) => setOverrideForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark paid
              </span>
              <span className="inline-flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" /> Link tx
              </span>
              <span className="inline-flex items-center gap-1">
                <Ban className="h-3.5 w-3.5" /> Ignore
              </span>
              <span className="inline-flex items-center gap-1">
                <StickyNote className="h-3.5 w-3.5" /> Notes
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOverride}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
