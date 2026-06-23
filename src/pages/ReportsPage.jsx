import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format, startOfMonth, endOfMonth } from "date-fns";
import axiosInstance from "../api/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const fetchReport = async () => {
    const { data } = await axiosInstance.get(
      `/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
    );
    setTransactions(data);
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const exportExcel = () => {
    const rows = transactions.map((t) => ({
      Date: format(new Date(t.date), "dd/MM/yyyy"),
      Type: t.type,
      Category: t.category,
      Remark: t.remark,
      Amount: t.amount,
    }));
    rows.push(
      {},
      { Date: "Total Income", Amount: totalIncome },
      { Date: "Total Expense", Amount: totalExpense },
      { Date: "Net Balance", Amount: totalIncome - totalExpense }
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
    const header = "Date,Type,Category,Remark,Amount\n";
    const rows = transactions
      .map(
        (t) =>
          `${format(new Date(t.date), "dd/MM/yyyy")},${t.type},${t.category},"${t.remark}",${t.amount}`
      )
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Income", value: totalIncome, color: "text-green-600" },
          { label: "Total Expense", value: totalExpense, color: "text-red-500" },
          { label: "Net Balance", value: totalIncome - totalExpense, color: "text-foreground" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-border">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-xl font-semibold ${color}`}>
                ₹{value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

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
                {["Date", "Type", "Category", "Remark", "Amount"].map((h) => (
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
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-b border-border/50 hover:bg-card/50">
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {format(new Date(tx.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-2.5 capitalize">{tx.type}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tx.category}</td>
                  <td className="px-4 py-2.5">{tx.remark}</td>
                  <td
                    className={`px-4 py-2.5 font-semibold ${
                      tx.type === "income" ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}₹
                    {tx.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
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

