import { useEffect, useState } from "react";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Wallet, Clock, AlertCircle, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import axiosInstance from "../api/axios";

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

const StatCard = ({ title, value, icon: Icon, color, isCurrency = true }) => (
  <Card className="border-border bg-card">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold text-foreground">
        {isCurrency
          ? `\u20B9${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
          : value}
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

  // Pending order metrics
  const pendingOrders = transactions.filter(
    (t) => t.isPendingOrder && (t.status === "pending" || t.status === "partially_paid")
  );
  const pendingCount = pendingOrders.length;
  const totalAdvanceCollected = pendingOrders.reduce((s, t) => s + (t.advanceAmount || 0), 0);
  const totalPendingReceivables = pendingOrders.reduce((s, t) => s + (t.pendingAmount || 0), 0);

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
      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Income" value={totalIncome} icon={TrendingUp} color="text-green-500" />
        <StatCard title="Total Expense" value={totalExpense} icon={TrendingDown} color="text-red-500" />
        <StatCard
          title="Net Balance"
          value={net}
          icon={Wallet}
          color={net >= 0 ? "text-green-500" : "text-red-500"}
        />
      </div>

      {/* Pending Orders Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Pending Orders"
          value={pendingCount}
          icon={Clock}
          color="text-orange-500"
          isCurrency={false}
        />
        <StatCard
          title="Advance Collected"
          value={totalAdvanceCollected}
          icon={Banknote}
          color="text-blue-500"
        />
        <StatCard
          title="Pending Receivables"
          value={totalPendingReceivables}
          icon={AlertCircle}
          color="text-orange-500"
        />
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
                  {["Date", "Type", "User", "Remark", "Amount", "Status"].map((h) => (
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
                {recent.map((tx) => {
                  const st = tx.status || "completed";
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
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
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
                No transactions found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
