import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, FileBarChart, CalendarDays, Menu } from "lucide-react";
import { cn } from "../../lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { SidebarContent } from "./Sidebar";

const tabs = [
  { to: "/", icon: LayoutDashboard, label: "Home", end: true },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/reports", icon: FileBarChart, label: "Reports" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
];

function TabLink({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-1.5"
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span
            className={cn(
              "text-[10px] font-medium leading-none",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function MobileBottomNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch">
        {tabs.map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-muted-foreground"
              aria-label="More"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">More</span>
            </button>
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
      </div>
    </nav>
  );
}
