import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  AlertCircle,
  Banknote,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "../components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import axiosInstance from "../api/axios";
import { cn } from "../lib/utils";

const STATUS_STYLES = {
  completed: "bg-block-mint/60 text-vivid-mint border-vivid-mint/30 dark:bg-vivid-mint/15",
  pending: "bg-block-cream/70 text-vivid-cream border-vivid-cream/30 dark:bg-vivid-cream/15",
  partially_paid: "bg-block-lilac/50 text-vivid-lilac border-vivid-lilac/30 dark:bg-vivid-lilac/15",
};
const STATUS_LABELS = {
  completed: "Completed",
  pending: "Pending",
  partially_paid: "Partially Paid",
};

const TONE_STYLES = {
  mint: "bg-block-mint/60 text-vivid-mint dark:bg-vivid-mint/15",
  coral: "bg-block-coral/60 text-vivid-coral dark:bg-vivid-coral/15",
  lilac: "bg-block-lilac/50 text-vivid-lilac dark:bg-vivid-lilac/15",
  cream: "bg-block-cream/70 text-vivid-cream dark:bg-vivid-cream/15",
  sky: "bg-block-sky/60 text-vivid-sky dark:bg-vivid-sky/15",
};

const CARD_TONES = {
  mint: { edge: "bg-vivid-mint", chip: "bg-block-mint/60 text-vivid-mint dark:bg-vivid-mint/15", value: "text-vivid-mint" },
  coral: { edge: "bg-vivid-coral", chip: "bg-block-coral/60 text-vivid-coral dark:bg-vivid-coral/15", value: "text-vivid-coral" },
  lilac: { edge: "bg-vivid-lilac", chip: "bg-block-lilac/50 text-vivid-lilac dark:bg-vivid-lilac/15", value: "text-vivid-lilac" },
  cream: { edge: "bg-vivid-cream", chip: "bg-block-cream/70 text-vivid-cream dark:bg-vivid-cream/15", value: "text-vivid-cream" },
  sky: { edge: "bg-vivid-sky", chip: "bg-block-sky/60 text-vivid-sky dark:bg-vivid-sky/15", value: "text-vivid-sky" },
};

const RATE_CHART = [
  [
    { dims: "3 x 2", rate: 250 },
    { dims: "4 x 3", rate: 350 },
    { dims: "5 x 3", rate: 450 },
    { dims: "6 x 3", rate: 500 },
    { dims: "6 x 4", rate: 600 },
    { dims: "8 x 3", rate: 700 },
    { dims: "8 x 4", rate: 750 },
  ],
  [
    { dims: "8 x 5", rate: 800 },
    { dims: "8 x 6", rate: 850 },
    { dims: "10 x 5", rate: 900 },
    { dims: "10 x 6", rate: 1000 },
    { dims: "10 x 8", rate: 1100 },
    { dims: "12 x 8", rate: 1400 },
    { dims: "15 x 8", rate: 1680 },
  ],
  [
    { dims: "20 x 8", rate: 2240 },
    { dims: "10 x 10", rate: 1400 },
    { dims: "12 x 10", rate: 1680 },
    { dims: "15 x 10", rate: 2100 },
    { dims: "20 x 10", rate: 2800 },
    { dims: "30 x 10", rate: 4200 },
    { dims: "50 x 10", rate: 5700 },
  ],
];

const cashFlowConfig = {
  income: { label: "Income", color: "#3b82f6" },
  expense: { label: "Expense", color: "#e2593c" },
};

const StatCard = ({ title, value, icon: Icon, tone = "lilac", isCurrency = true, onClick, delay = 0 }) => {
  const t = CARD_TONES[tone];

  return (
    <Card
      className={cn(
        "relative overflow-hidden animate-fade-up border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover",
        onClick && "cursor-pointer hover:border-primary/40"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", t.edge)}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", t.chip)}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className={cn("font-display text-2xl font-semibold tracking-tight tabular-nums", t.value)}>
          {isCurrency
            ? `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
            : value}
        </p>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNetBalance, setShowNetBalance] = useState(false);
  const [pendingDialog, setPendingDialog] = useState(null);
  const [inHand, setInHand] = useState("0");
  const [editingInHand, setEditingInHand] = useState(false);
  const [expenseOverride, setExpenseOverride] = useState(null);
  const [editingExpense, setEditingExpense] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/transactions/all")
      .then((r) => setTransactions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    axiosInstance
      .get("/cash-overview")
      .then((r) => {
        setInHand(String(r.data.inHand ?? 0));
        setExpenseOverride(
          r.data.totalExpenseOverride != null ? String(r.data.totalExpenseOverride) : null
        );
      })
      .catch(console.error);
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

  // Daily net balance breakdown
  const dailyMap = {};
  transactions.forEach((tx) => {
    const day = format(new Date(tx.date), "yyyy-MM-dd");
    if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 };
    if (tx.type === "income") dailyMap[day].income += tx.amount;
    else dailyMap[day].expense += tx.amount;
  });
  const dailyBreakdown = Object.entries(dailyMap)
    .map(([date, { income, expense }]) => ({ date, income, expense, net: income - expense }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Running balance: cumulative net from the first day up to each day
  let runningBalance = 0;
  const dailyWithBalance = [...dailyBreakdown]
    .reverse()
    .map((d) => {
      runningBalance += d.net;
      return { ...d, balance: runningBalance };
    })
    .reverse();

  // Chart data
  const cashFlowData = [...dailyBreakdown].reverse().slice(-30);

  const recent = transactions.slice(0, 15);

  const saveInHand = (value) => {
    const amount = Number(value) || 0;
    setInHand(String(amount));
    setEditingInHand(false);
    axiosInstance.put("/cash-overview", { inHand: amount }).catch(console.error);
  };

  const saveExpenseOverride = (value) => {
    const amount = Number(value) || 0;
    setExpenseOverride(String(amount));
    setEditingExpense(false);
    axiosInstance
      .put("/cash-overview", { totalExpenseOverride: amount })
      .catch(console.error);
  };

  const displayedExpense =
    expenseOverride !== null ? Number(expenseOverride) : totalExpense;

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Income" value={totalIncome} icon={TrendingUp} tone="sky" />
        <StatCard title="Total Expense" value={totalExpense} icon={TrendingDown} tone="coral" delay={60} />
        <StatCard
          title="Net Balance"
          value={net}
          icon={Wallet}
          tone={net >= 0 ? "mint" : "coral"}
          onClick={() => setShowNetBalance(true)}
          delay={120}
        />
        <StatCard
          title="Pending Receivables"
          value={totalPendingReceivables}
          icon={AlertCircle}
          tone="cream"
          delay={180}
        />
      </div>

      {/* Charts row: cash flow + payment split */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="animate-fade-up border-border shadow-card lg:col-span-2"
          style={{ animationDelay: "240ms" }}
        >
          <CardHeader>
            <CardTitle className="text-base">Cash Flow</CardTitle>
            <p className="text-xs text-muted-foreground">
              Income vs expense, last {cashFlowData.length} active day{cashFlowData.length === 1 ? "" : "s"}
            </p>
          </CardHeader>
          <CardContent>
            {cashFlowData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ChartContainer config={cashFlowConfig} className="h-64 w-full">
                <AreaChart data={cashFlowData} margin={{ left: 4, right: 4 }}>
                  <defs>
                    <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    tickFormatter={(value) => format(new Date(value), "d MMM")}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(value, payload) =>
                          format(new Date(payload?.[0]?.payload?.date ?? value), "dd MMM yyyy")
                        }
                      />
                    }
                  />
                  <Area
                    dataKey="income"
                    type="monotone"
                    fill="url(#fillIncome)"
                    stroke="var(--color-income)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="expense"
                    type="monotone"
                    fill="url(#fillExpense)"
                    stroke="var(--color-expense)"
                    strokeWidth={2}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up border-border shadow-card" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="text-base">Pending Orders</CardTitle>
            <p className="text-xs text-muted-foreground">Open orders awaiting collection</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: "open", label: "Open orders", value: pendingCount, icon: Clock, tone: "cream", isCurrency: false },
              { id: "advance", label: "Advance collected", value: totalAdvanceCollected, icon: Banknote, tone: "lilac" },
              { id: "receivable", label: "Yet to receive", value: totalPendingReceivables, icon: AlertCircle, tone: "coral" },
            ].map(({ id, label, value, icon: Icon, tone, isCurrency = true }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPendingDialog(id)}
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    TONE_STYLES[tone]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-display text-base font-semibold tabular-nums">
                    {isCurrency ? `₹${value.toLocaleString("en-IN")}` : value}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">View</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Rate chart + payment methods */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="animate-fade-up border-border shadow-card lg:col-span-2"
          style={{ animationDelay: "360ms" }}
        >
          <CardHeader>
            <CardTitle className="text-base">Rate Chart</CardTitle>
            <p className="text-xs text-muted-foreground">Size × rate reference (₹)</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-border bg-muted/40 px-3 py-4 sm:px-5 sm:py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                {RATE_CHART.map((col, ci) => (
                  <div key={ci} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Size</span>
                      <span>Rate</span>
                    </div>
                    {col.map((row) => (
                      <div
                        key={`${row.dims}-${row.rate}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <span className="font-medium tabular-nums text-muted-foreground">
                          {row.dims}
                        </span>
                        <span className="font-display font-semibold tabular-nums text-foreground">
                          ₹{row.rate.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up border-border shadow-card" style={{ animationDelay: "420ms" }}>
          <CardHeader>
            <CardTitle className="text-base">Cash Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Expense total and cash in hand</p>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-muted-foreground">Total Expense</td>
                  <td className="px-4 py-3 text-right">
                    {editingExpense ? (
                      <input
                        type="number"
                        autoFocus
                        defaultValue={displayedExpense}
                        onBlur={(e) => saveExpenseOverride(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveExpenseOverride(e.target.value);
                          if (e.key === "Escape") setEditingExpense(false);
                        }}
                        className="w-28 rounded border border-border bg-background px-1 py-0.5 text-right font-display text-base font-semibold tabular-nums outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingExpense(true)}
                        className="font-display text-base font-semibold tabular-nums text-vivid-coral hover:underline"
                      >
                        ₹{displayedExpense.toLocaleString("en-IN")}
                      </button>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground">In Hand</td>
                  <td className="px-4 py-3 text-right">
                    {editingInHand ? (
                      <input
                        type="number"
                        autoFocus
                        defaultValue={inHand}
                        onBlur={(e) => saveInHand(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveInHand(e.target.value);
                          if (e.key === "Escape") setEditingInHand(false);
                        }}
                        className="w-28 rounded border border-border bg-background px-1 py-0.5 text-right font-display text-base font-semibold tabular-nums outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingInHand(true)}
                        className="font-display text-base font-semibold tabular-nums text-vivid-mint hover:underline"
                      >
                        ₹{Number(inHand).toLocaleString("en-IN")}
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="animate-fade-up border-border shadow-card" style={{ animationDelay: "480ms" }}>
        <CardHeader>
          <CardTitle className="text-base">
            Recent Transactions ({transactions.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  {["Date", "Type", "User", "Remark", "Payment", "Amount", "Status"].map((h) => (
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
                              ? "bg-block-sky/60 text-vivid-sky border-vivid-sky/30 dark:bg-vivid-sky/15"
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
                        <span
                          className={`font-semibold tabular-nums ${
                            tx.type === "income" ? "text-vivid-sky" : "text-vivid-coral"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}{"₹"}
                          {tx.amount.toLocaleString("en-IN")}
                        </span>
                        {tx.isPendingOrder && (
                          <span className="block text-xs text-muted-foreground">
                            Total: {"₹"}{tx.totalOrderAmount?.toLocaleString("en-IN")}
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
      {/* Net Balance Dialog */}
      <Dialog open={showNetBalance} onOpenChange={setShowNetBalance}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Daily Net Balance Breakdown</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border text-left">
                  {["Date", "Income", "Expense", "Day Net", "Balance"].map((h) => (
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
                {dailyWithBalance.map((day) => (
                  <tr key={day.date} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {format(new Date(day.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-vivid-sky">
                      +{"₹"}{day.income.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-vivid-coral">
                      -{"₹"}{day.expense.toLocaleString("en-IN")}
                    </td>
                    <td className={`px-4 py-2.5 font-semibold tabular-nums ${day.net >= 0 ? "text-vivid-mint" : "text-vivid-coral"}`}>
                      {"₹"}{day.net.toLocaleString("en-IN")}
                    </td>
                    <td className={`px-4 py-2.5 font-semibold tabular-nums ${day.balance >= 0 ? "text-vivid-lilac" : "text-vivid-coral"}`}>
                      {"₹"}{day.balance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-background">
                <tr className="border-t-2 border-border">
                  <td className="px-4 py-3 font-semibold">Total</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-vivid-sky">
                    +{"₹"}{totalIncome.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-vivid-coral">
                    -{"₹"}{totalExpense.toLocaleString("en-IN")}
                  </td>
                  <td className={`px-4 py-3 font-semibold tabular-nums ${net >= 0 ? "text-vivid-mint" : "text-vivid-coral"}`}>
                    {"₹"}{net.toLocaleString("en-IN")}
                  </td>
                  <td className={`px-4 py-3 font-semibold tabular-nums ${net >= 0 ? "text-vivid-lilac" : "text-vivid-coral"}`}>
                    {"₹"}{net.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
            {dailyBreakdown.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No data available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Orders Detail Dialog */}
      <Dialog open={!!pendingDialog} onOpenChange={(o) => !o && setPendingDialog(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {pendingDialog === "open" && "Open Orders"}
              {pendingDialog === "advance" && "Advance Collected"}
              {pendingDialog === "receivable" && "Yet to Receive"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {pendingDialog === "open" && "Orders still awaiting full payment"}
              {pendingDialog === "advance" && "Advance received against open orders"}
              {pendingDialog === "receivable" && "Outstanding balance to collect per order"}
            </p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            {(() => {
              const rows =
                pendingDialog === "advance"
                  ? pendingOrders.filter((o) => (o.advanceAmount || 0) > 0)
                  : pendingDialog === "receivable"
                    ? pendingOrders.filter((o) => (o.pendingAmount || 0) > 0)
                    : pendingOrders;
              const advanceTotal = rows.reduce((s, o) => s + (o.advanceAmount || 0), 0);
              const pendingTotal = rows.reduce((s, o) => s + (o.pendingAmount || 0), 0);

              if (rows.length === 0) {
                return (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No orders to show.
                  </p>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b border-border text-left">
                        {["Date", "Remark", "User", "Total", "Advance", "Pending", "Status"].map((h) => (
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
                      {rows.map((o) => {
                        const st = o.status || "pending";
                        return (
                          <tr
                            key={o._id}
                            className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                          >
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {format(new Date(o.date), "dd MMM yyyy")}
                            </td>
                            <td className="px-4 py-2.5 font-medium">{o.remark}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {o.user?.name || "—"}
                            </td>
                            <td className="px-4 py-2.5 font-semibold tabular-nums">
                              {"₹"}{(o.totalOrderAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td
                              className={cn(
                                "px-4 py-2.5 tabular-nums",
                                pendingDialog === "advance"
                                  ? "font-semibold text-vivid-lilac"
                                  : "text-muted-foreground"
                              )}
                            >
                              {"₹"}{(o.advanceAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td
                              className={cn(
                                "px-4 py-2.5 tabular-nums",
                                pendingDialog === "receivable"
                                  ? "font-semibold text-vivid-coral"
                                  : "text-muted-foreground"
                              )}
                            >
                              {"₹"}{(o.pendingAmount || 0).toLocaleString("en-IN")}
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
                    <tfoot className="sticky bottom-0 bg-background">
                      <tr className="border-t-2 border-border">
                        <td className="px-4 py-3 font-semibold" colSpan={3}>
                          Total ({rows.length} order{rows.length === 1 ? "" : "s"})
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {"₹"}
                          {rows
                            .reduce((s, o) => s + (o.totalOrderAmount || 0), 0)
                            .toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums text-vivid-lilac">
                          {"₹"}{advanceTotal.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums text-vivid-coral">
                          {"₹"}{pendingTotal.toLocaleString("en-IN")}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
