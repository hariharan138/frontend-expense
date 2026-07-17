import { createContext, useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileBarChart,
  CalendarDays,
  Banknote,
  StickyNote,
  LogOut,
  Menu,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import ThemeToggle from "../theme/ThemeToggle";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/payroll", icon: Banknote, label: "Payroll" },
  { to: "/notes", icon: StickyNote, label: "Notes" },
  { to: "/reports", icon: FileBarChart, label: "Reports" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
];

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true"
  );

  const toggle = () =>
    setCollapsed((c) => {
      localStorage.setItem("sidebar-collapsed", String(!c));
      return !c;
    });

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

function SidebarContent({ collapsed = false }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      {/* Brand — h matches the topbar so the dividers align */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-3",
          collapsed ? "justify-center px-2" : "px-4"
        )}
      >
        <img
          src="/logo.png"
          alt="Vetri Digitals logo"
          className="h-9 w-9 shrink-0 object-contain"
        />
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-semibold tracking-tight">
              Vetri Digitals
            </h1>
            <p className="truncate text-xs text-muted-foreground">Finance tracker</p>
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 py-4", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
        )}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"} title={collapsed ? label : undefined}>
            {({ isActive }) => (
              <span
                className={cn(
                  "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User + actions */}
      <div className={cn("space-y-3", collapsed ? "p-2 py-4" : "p-4")}>
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed
              ? "flex-col"
              : "rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5"
          )}
          title={collapsed ? `${user?.name} · ${user?.email}` : undefined}
        >
          <Avatar>
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          )}
          <ThemeToggle className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" />
        </div>

        <Button
          variant="ghost"
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "w-full gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed ? "justify-center px-0" : "justify-start"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  const sidebar = useSidebar();
  const collapsed = sidebar?.collapsed ?? false;

  return (
    <aside
      className={cn(
        "hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out md:flex",
        collapsed ? "md:w-16" : "md:w-64"
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}

export function MobileSidebarMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <div onClick={() => setOpen(false)}>
          <SidebarContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebarMenu />
    </>
  );
}
