import { useEffect, useState } from "react";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";
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
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    net: 0,
    transactions: [],
  });
  const [selectedDate, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    axiosInstance
      .get(`/transactions/daily-summary?date=${selectedDate}`)
      .then((r) => setSummary(r.data))
      .catch(console.error);
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shadow-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm text-foreground outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Income"
          value={summary.totalIncome}
          icon={TrendingUp}
          color="text-green-500"
        />
        <StatCard
          title="Total Expense"
          value={summary.totalExpense}
          icon={TrendingDown}
          color="text-red-500"
        />
        <StatCard
          title="Net Balance"
          value={summary.net}
          icon={Wallet}
          color="text-primary"
        />
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">
            Transactions —{" "}
            {format(new Date(`${selectedDate}T00:00:00`), "dd MMM yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {summary.transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tx.remark}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category} • {format(new Date(tx.date), "hh:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={tx.type === "income" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {tx.type}
                    </Badge>
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === "income" ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}₹
                      {tx.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

