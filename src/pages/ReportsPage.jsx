import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format, startOfMonth, endOfMonth } from "date-fns";
import axiosInstance from "../api/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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

export default function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [statusFilter, setStatusFilter] = useState("");

  const fetchReport = async () => {
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    if (statusFilter) params.set("status", statusFilter);
    const { data } = await axiosInstance.get(`/transactions?${params}`);
    setTransactions(data);
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, statusFilter]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalPending = transactions
    .filter((t) => t.isPendingOrder && t.status !== "completed")
    .reduce((s, t) => s + (t.pendingAmount || 0), 0);

  const exportExcel = () => {
    const rows = transactions.map((t) => ({
      Date: format(new Date(t.date), "dd/MM/yyyy"),
      Type: t.type,
      Remark: t.remark,
      Amount: t.amount,
      Status: STATUS_LABELS[t.status] || t.status || "Completed",
      "Total Order Amount": t.isPendingOrder ? t.totalOrderAmount : "",
      "Advance Amount": t.isPendingOrder ? t.advanceAmount : "",
      "Pending Amount": t.isPendingOrder ? t.pendingAmount : "",
    }));
    rows.push(
      {},
      { Date: "Total Income", Amount: totalIncome },
      { Date: "Total Expense", Amount: totalExpense },
      { Date: "Net Balance", Amount: totalIncome - totalExpense },
      { Date: "Pending Receivables", Amount: totalPending }
    );

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `expense-report-${dateRange.startDate}.xlsx`
    );
  };

  const exportCSV = () => {
    const header = "Date,Type,Remark,Amount,Status,Total Order Amount,Advance Amount,Pending Amount\n";
    const rows = transactions
      .map((t) => {
        const status = STATUS_LABELS[t.status] || t.status || "Completed";
        const totalOrd = t.isPendingOrder ? t.totalOrderAmount : "";
        const adv = t.isPendingOrder ? t.advanceAmount : "";
        const pend = t.isPendingOrder ? t.pendingAmount : "";
        return `${format(new Date(t.date), "dd/MM/yyyy")},${t.type},"${t.remark}",${t.amount},${status},${totalOrd},${adv},${pend}`;
      })
      .join("\n");
    saveAs(
      new Blob([header + rows], { type: "text/csv" }),
      `expense-report-${dateRange.startDate}.csv`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          CSV
        </Button>
        <Button onClick={exportExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Label className="flex items-center mr-2">Status:</Label>
            <Button
              size="sm"
              variant={statusFilter === "" ? "default" : "outline"}
              onClick={() => setStatusFilter("")}
            >
              All
            </Button>
            {["completed", "pending", "partially_paid"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
              >
                {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Income", value: totalIncome, color: "text-green-600" },
          { label: "Total Expense", value: totalExpense, color: "text-red-500" },
          { label: "Net Balance", value: totalIncome - totalExpense, color: "text-foreground" },
          { label: "Pending Receivables", value: totalPending, color: "text-orange-500" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-border">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-xl font-semibold ${color}`}>
                {"\u20B9"}{value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">
            Transaction Preview ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                {["Date", "Type", "Remark", "Amount", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const st = tx.status || "completed";
                return (
                  <tr key={tx._id} className="border-b border-border/50 hover:bg-card/50">
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {format(new Date(tx.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-2.5 capitalize">{tx.type}</td>
                    <td className="px-4 py-2.5">{tx.remark}</td>
                    <td className="px-4 py-2.5">
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
                          {tx.pendingAmount > 0 && ` | Pending: \u20B9${tx.pendingAmount.toLocaleString("en-IN")}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={`text-xs ${STATUS_STYLES[st]}`}>
                        {STATUS_LABELS[st]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No data in selected range.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
