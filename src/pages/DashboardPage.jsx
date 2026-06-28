import { useEffect, useState } from "react";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import axiosInstance from "../api/axios";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="border-border bg-card">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold text-foreground">
        ₹{value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </p>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/transactions/all")
      .then((r) => setTransactions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  // Category-wise breakdown
  const categoryTotals = {};
  transactions.forEach((tx) => {
    const key = `${tx.type}:${tx.category || "Other"}`;
    categoryTotals[key] = (categoryTotals[key] || 0) + tx.amount;
  });

  const expenseCategories = Object.entries(categoryTotals)
    .filter(([k]) => k.startsWith("expense:"))
    .map(([k, v]) => ({ category: k.split(":")[1], total: v }))
    .sort((a, b) => b.total - a.total);

  const incomeCategories = Object.entries(categoryTotals)
    .filter(([k]) => k.startsWith("income:"))
    .map(([k, v]) => ({ category: k.split(":")[1], total: v }))
    .sort((a, b) => b.total - a.total);

  // Recent 15 transactions
  const recent = transactions.slice(0, 15);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Income"
          value={totalIncome}
          icon={TrendingUp}
          color="text-green-500"
        />
        <StatCard
          title="Total Expense"
          value={totalExpense}
          icon={TrendingDown}
          color="text-red-500"
        />
        <StatCard
          title="Net Balance"
          value={net}
          icon={Wallet}
          color={net >= 0 ? "text-green-500" : "text-red-500"}
        />
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              Expense by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet.</p>
            ) : (
              <div className="space-y-3">
                {expenseCategories.map(({ category, total }) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{category}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 rounded-full bg-red-500/20 w-24">
                        <div
                          className="h-2 rounded-full bg-red-500"
                          style={{ width: `${(total / totalExpense) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-red-500 w-24 text-right">
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              Income by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income yet.</p>
            ) : (
              <div className="space-y-3">
                {incomeCategories.map(({ category, total }) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{category}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 rounded-full bg-green-500/20 w-24">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${(total / totalIncome) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-green-500 w-24 text-right">
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">
            Recent Transactions ({transactions.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-left">
                  {["Date", "Type", "Category", "User", "Remark", "Amount"].map((h) => (
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
                {recent.map((tx) => (
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
    </div>
  );
}
