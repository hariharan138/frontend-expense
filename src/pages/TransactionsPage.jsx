import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
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

const STATUS_STYLES = {
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  pending: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  partially_paid: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};
const STATUS_LABELS = {
  completed: "Completed",
  pending: "Pending",
  partially_paid: "Partially Paid",
};

const EMPTY_FORM = {
  type: "expense",
  amount: "",
  remark: "",
  date: format(new Date(), "yyyy-MM-dd"),
  shared: false,
  isPendingOrder: false,
  totalOrderAmount: "",
  advanceAmount: "",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
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
      totalOrderAmount: tx.totalOrderAmount || "",
      advanceAmount: tx.advanceAmount || "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.remark || String(form.remark).trim() === "") {
      alert("Please enter a remark.");
      return;
    }

    let payload;

    if (form.isPendingOrder) {
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

  const pendingCalc = form.isPendingOrder
    ? Math.max(0, Number(form.totalOrderAmount || 0) - Number(form.advanceAmount || 0))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate} className="gap-2">
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
                variant={filters.type === t ? "default" : "outline"}
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
            {["completed", "pending", "partially_paid"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filters.status === s ? "default" : "outline"}
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
                <tr className="border-b border-border bg-card text-left">
                  {["Date", "Type", "User", "Remark", "Amount", "Status", "Actions"].map((h) => (
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
                {transactions.map((tx) => {
                  const st = tx.status || "completed";
                  const isPending = tx.isPendingOrder && st !== "completed";
                  return (
                    <tr
                      key={tx._id}
                      className="border-b border-border/50 hover:bg-card/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(tx.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={tx.type === "income" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.user?.name || tx.user}</td>
                      <td className="px-4 py-3 font-medium">{tx.remark}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${
                            tx.type === "income" ? "text-green-600" : "text-red-500"
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
                                  className="h-7 w-7 text-green-600 hover:text-green-700"
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
                                className="h-7 w-7 text-destructive hover:text-destructive"
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
            {transactions.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No transactions found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-3">
              {["income", "expense"].map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={form.type === t ? "default" : "outline"}
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pendingOrder"
                  checked={!!form.isPendingOrder}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isPendingOrder: e.target.checked }))
                  }
                />
                <Label htmlFor="pendingOrder" className="text-sm cursor-pointer">
                  Pending Order
                </Label>
              </div>
            )}

            {/* Amount — normal transactions */}
            {!form.isPendingOrder && (
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
            {form.isPendingOrder && (
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
                    className="bg-muted"
                  />
                </div>
              </>
            )}

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
