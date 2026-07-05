import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import axiosInstance from "../api/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { cn } from "../lib/utils";

const STATUS_STYLES = {
  completed: "bg-block-mint/60 text-vivid-mint border-vivid-mint/30 dark:bg-vivid-mint/15",
  pending: "bg-block-cream/70 text-vivid-cream border-vivid-cream/30 dark:bg-vivid-cream/15",
  partially_paid: "bg-block-lilac/50 text-vivid-lilac border-vivid-lilac/30 dark:bg-vivid-lilac/15",
  unconfirmed: "bg-block-pink/60 text-vivid-pink border-vivid-pink/30 dark:bg-vivid-pink/15",
};

const TYPE_FILTER_STYLES = {
  income: "border-vivid-mint bg-vivid-mint text-white hover:bg-vivid-mint/90",
  expense: "border-vivid-coral bg-vivid-coral text-white hover:bg-vivid-coral/90",
};

const STATUS_FILTER_STYLES = {
  completed: "border-vivid-mint bg-vivid-mint text-white hover:bg-vivid-mint/90",
  pending: "border-vivid-cream bg-vivid-cream text-white hover:bg-vivid-cream/90",
  partially_paid: "border-vivid-lilac bg-vivid-lilac text-white hover:bg-vivid-lilac/90",
  unconfirmed: "border-vivid-pink bg-vivid-pink text-white hover:bg-vivid-pink/90",
};
const STATUS_LABELS = {
  completed: "Completed",
  pending: "Pending",
  partially_paid: "Partially Paid",
  unconfirmed: "Unconfirmed",
};

const PAYMENT_METHODS = ["Cash", "UPI"];

const EMPTY_FORM = {
  type: "income",
  amount: "",
  remark: "",
  date: format(new Date(), "yyyy-MM-dd"),
  shared: false,
  isPendingOrder: false,
  isUnconfirmed: false,
  totalOrderAmount: "",
  advanceAmount: "",
  paymentMethod: "Cash",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const { user } = useAuth();

  const fetchData = async () => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    ).toString();
    const { data } = await axiosInstance.get(`/transactions?${params}`);
    const sorted = [...data].sort(
      (a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt)
    );
    setTransactions(sorted);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (tx) => {
    setEditing(tx._id);
    setForm({
      type: tx.type,
      amount: tx.isPendingOrder ? "" : tx.amount,
      remark: tx.remark,
      date: format(new Date(tx.date), "yyyy-MM-dd"),
      shared: !!tx.shared,
      isPendingOrder: !!tx.isPendingOrder,
      isUnconfirmed: tx.status === "unconfirmed",
      totalOrderAmount: tx.totalOrderAmount || "",
      advanceAmount: tx.advanceAmount || "",
      paymentMethod: tx.paymentMethod || "Cash",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.remark || String(form.remark).trim() === "") {
      alert("Please enter a remark.");
      return;
    }

    let payload;

    if (form.isUnconfirmed) {
      payload = {
        type: form.type,
        remark: form.remark,
        date: form.date,
        shared: form.shared,
        isPendingOrder: false,
        isUnconfirmed: true,
        paymentMethod: form.paymentMethod,
      };
    } else if (form.isPendingOrder) {
      const total = Number(form.totalOrderAmount);
      const advance = Number(form.advanceAmount);
      if (!total || total <= 0) {
        alert("Please enter a valid Total Order Amount.");
        return;
      }
      if (advance < 0 || isNaN(advance)) {
        alert("Please enter a valid Advance Amount.");
        return;
      }
      if (advance > total) {
        alert("Advance Amount cannot exceed Total Order Amount.");
        return;
      }
      payload = {
        type: form.type,
        remark: form.remark,
        date: form.date,
        shared: form.shared,
        isPendingOrder: true,
        totalOrderAmount: total,
        advanceAmount: advance,
        paymentMethod: form.paymentMethod,
      };
    } else {
      if (!form.amount || Number(form.amount) <= 0) {
        alert("Please enter a valid amount greater than 0.");
        return;
      }
      payload = {
        type: form.type,
        amount: Number(form.amount),
        remark: form.remark,
        date: form.date,
        shared: form.shared,
        isPendingOrder: false,
        paymentMethod: form.paymentMethod,
      };
    }

    try {
      if (editing) await axiosInstance.put(`/transactions/${editing}`, payload);
      else await axiosInstance.post("/transactions", payload);
      setOpen(false);
      fetchData();
    } catch (err) {
      console.error("Transaction request error:", err?.response?.data || err);
      const msg = err?.response?.data?.message || err.message || "Request failed";
      alert("Error: " + (typeof msg === "string" ? msg : JSON.stringify(msg)));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    await axiosInstance.delete(`/transactions/${id}`);
    fetchData();
  };

  const handleCollect = async (tx) => {
    const pending = tx.pendingAmount || 0;
    if (!confirm(`Collect pending amount of \u20B9${pending.toLocaleString("en-IN")}?`)) return;
    try {
      await axiosInstance.post(`/transactions/${tx._id}/collect`);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to collect payment");
    }
  };

  const filtered = search.trim()
    ? transactions.filter((tx) => {
        const q = search.toLowerCase();
        return (
          (tx.remark || "").toLowerCase().includes(q) ||
          (tx.type || "").toLowerCase().includes(q) ||
          (tx.user?.name || "").toLowerCase().includes(q) ||
          (tx.user?.email || "").toLowerCase().includes(q) ||
          (tx.paymentMethod || "Cash").toLowerCase().includes(q) ||
          (STATUS_LABELS[tx.status] || "Completed").toLowerCase().includes(q) ||
          String(tx.amount).includes(q) ||
          String(tx.totalOrderAmount || "").includes(q) ||
          String(tx.pendingAmount || "").includes(q) ||
          format(new Date(tx.date), "dd MMM yyyy").toLowerCase().includes(q)
        );
      })
    : transactions;

  const pendingCalc = form.isPendingOrder
    ? Math.max(0, Number(form.totalOrderAmount || 0) - Number(form.advanceAmount || 0))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["income", "expense"].map((t) => (
              <Button
                key={t}
                size="sm"
                variant="outline"
                className={cn(filters.type === t && TYPE_FILTER_STYLES[t])}
                onClick={() =>
                  setFilters((p) => ({ ...p, type: p.type === t ? "" : t }))
                }
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Label className="flex items-center mr-2">Status:</Label>
            {["completed", "pending", "partially_paid", "unconfirmed"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                className={cn(filters.status === s && STATUS_FILTER_STYLES[s])}
                onClick={() =>
                  setFilters((p) => ({ ...p, status: p.status === s ? "" : s }))
                }
              >
                {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">All Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  {["Date", "Type", "User", "Remark", "Payment", "Amount", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const st = tx.status || "completed";
                  const isPending = tx.isPendingOrder && st !== "completed";
                  return (
                    <tr
                      key={tx._id}
                      className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(tx.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${
                            tx.type === "income"
                              ? "bg-block-mint/60 text-vivid-mint border-vivid-mint/30 dark:bg-vivid-mint/15"
                              : "bg-block-coral/60 text-vivid-coral border-vivid-coral/30 dark:bg-vivid-coral/15"
                          }`}
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.user?.name || tx.user}</td>
                      <td className="px-4 py-3 font-medium">{tx.remark}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.paymentMethod || "Cash"}</td>
                      <td className="px-4 py-3">
                        {st === "unconfirmed" ? (
                          <span className="text-muted-foreground">\u2014</span>
                        ) : (
                          <>
                            <span
                              className={`font-semibold tabular-nums ${
                                tx.type === "income" ? "text-vivid-mint" : "text-vivid-coral"
                              }`}
                            >
                              {tx.type === "income" ? "+" : "-"}{"\u20B9"}
                              {tx.amount.toLocaleString("en-IN")}
                            </span>
                            {tx.isPendingOrder && (
                              <span className="block text-xs text-muted-foreground">
                                Total: {"\u20B9"}{tx.totalOrderAmount?.toLocaleString("en-IN")}
                                {isPending && ` | Pending: \u20B9${(tx.pendingAmount || 0).toLocaleString("en-IN")}`}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${STATUS_STYLES[st]}`}>
                          {STATUS_LABELS[st]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {user && (
                            <>
                              {isPending && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleCollect(tx)}
                                  className="h-7 w-7 text-vivid-mint hover:text-vivid-mint hover:bg-block-mint/40"
                                  title="Collect Payment"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEdit(tx)}
                                className="h-7 w-7"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(tx._id)}
                                className="h-7 w-7 text-vivid-coral hover:text-vivid-coral hover:bg-block-coral/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {search.trim() ? "No transactions match your search." : "No transactions found."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          </DialogHeader>
          <div className="-mr-2 flex-1 space-y-4 overflow-y-auto py-2 pr-2">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-3">
              {["income", "expense"].map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant="outline"
                  className={cn(form.type === t && TYPE_FILTER_STYLES[t])}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      type: t,
                      ...(t === "expense" ? { isPendingOrder: false } : {}),
                    }))
                  }
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>

            {/* Pending Order checkbox — income only */}
            {form.type === "income" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pendingOrder"
                    checked={!!form.isPendingOrder}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        isPendingOrder: e.target.checked,
                        ...(e.target.checked ? { isUnconfirmed: false } : {}),
                      }))
                    }
                  />
                  <Label htmlFor="pendingOrder" className="text-sm cursor-pointer">
                    Pending Order
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="unconfirmed"
                    checked={!!form.isUnconfirmed}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        isUnconfirmed: e.target.checked,
                        ...(e.target.checked ? { isPendingOrder: false } : {}),
                      }))
                    }
                  />
                  <Label htmlFor="unconfirmed" className="text-sm cursor-pointer">
                    Amount not confirmed yet
                  </Label>
                </div>
                {form.isUnconfirmed && (
                  <p className="text-xs text-muted-foreground">
                    Records this job with no amount. It won't affect your totals until you edit it later with the real amount received.
                  </p>
                )}
              </div>
            )}

            {/* Amount — normal transactions */}
            {!form.isPendingOrder && !form.isUnconfirmed && (
              <div className="space-y-1.5">
                <Label>Amount ({"\u20B9"})</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
            )}

            {/* Pending order fields */}
            {form.isPendingOrder && !form.isUnconfirmed && (
              <>
                <div className="space-y-1.5">
                  <Label>Total Order Amount ({"\u20B9"})</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={form.totalOrderAmount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, totalOrderAmount: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Advance Amount ({"\u20B9"})</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={form.advanceAmount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, advanceAmount: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pending Amount ({"\u20B9"})</Label>
                  <Input
                    type="number"
                    readOnly
                    value={pendingCalc}
                    className="bg-block-cream/40 dark:bg-vivid-cream/10"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.paymentMethod}
                onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Remark</Label>
              <Input
                placeholder={form.type === "income" ? "e.g. Monthly salary" : "e.g. Lunch at office"}
                value={form.remark}
                onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            {user?.role === "admin" && (
              <div className="space-y-1.5">
                <Label>Shared (visible to all users)</Label>
                <div>
                  <input
                    type="checkbox"
                    checked={!!form.shared}
                    onChange={(e) => setForm((p) => ({ ...p, shared: e.target.checked }))}
                  />{" "}
                  <span className="text-sm text-muted-foreground">
                    Make this transaction visible to all users
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editing ? "Update" : "Add"} Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
