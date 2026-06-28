import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

const CATEGORIES = [
  "Food",
  "Transport",
  "Utilities",
  "Entertainment",
  "Health",
  "Salary",
  "Freelance",
  "Other",
];

const EMPTY_FORM = {
  type: "expense",
  amount: "",
  remark: "",
  category: "Other",
  date: format(new Date(), "yyyy-MM-dd"),
  shared: false,
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    startDate: "",
    endDate: "",
  });

  const { user } = useAuth();

  const fetchData = async () => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    ).toString();
    const { data } = await axiosInstance.get(`/transactions?${params}`);
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
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
      amount: tx.amount,
      remark: tx.remark,
      category: tx.category,
      date: format(new Date(tx.date), "yyyy-MM-dd"),
      shared: !!tx.shared,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    // client-side validation
    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    if (!form.remark || String(form.remark).trim() === "") {
      alert("Please enter a remark.");
      return;
    }

    const payload = {
      ...form,
      amount: Number(form.amount),
      category: form.category || "Other",
    };

    // debug: log payload before sending
    console.log("Creating/updating transaction payload:", payload);

    try {
      if (editing) await axiosInstance.put(`/transactions/${editing}`, payload);
      else await axiosInstance.post("/transactions", payload);
      setOpen(false);
      fetchData();
    } catch (err) {
      // log full error for debugging (network/response/body)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </div>

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
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                placeholder="All"
                value={filters.category}
                onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">All Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left">
                  {["Date", "Type", "Category", "User", "Remark", "Amount", "Actions"].map((h) => (
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
                {transactions.map((tx) => (
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
                    <td className="px-4 py-3 text-muted-foreground">{tx.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.user?.name || tx.user}</td>
                    <td className="px-4 py-3 font-medium">{tx.remark}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        tx.type === "income" ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}₹
                      {tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {user && (
                          <>
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
                ))}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              {["income", "expense"].map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={form.type === t ? "default" : "outline"}
                  onClick={() => setForm((p) => ({ ...p, type: t }))}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              />
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
              <Label>Category</Label>
              <Input
                placeholder="e.g. Food, Transport, Utilities"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
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
                  />{' '}
                  <span className="text-sm text-muted-foreground">Make this transaction visible to all users</span>
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

