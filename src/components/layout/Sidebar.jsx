import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileBarChart,
  LogOut,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import ThemeToggle from "../theme/ThemeToggle";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/reports", icon: FileBarChart, label: "Reports" },
];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight">ExpenseIQ</h1>
          <p className="truncate text-xs text-muted-foreground">Finance tracker</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}>
            {({ isActive }) => (
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User + actions */}
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-background/50 px-3 py-2.5">
          <Avatar>
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <ThemeToggle className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" />
        </div>

        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
