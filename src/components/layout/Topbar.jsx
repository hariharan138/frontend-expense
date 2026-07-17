import { useLocation } from "react-router-dom";
import { PanelLeft } from "lucide-react";
import ThemeToggle from "../theme/ThemeToggle";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useSidebar } from "./Sidebar";

const titles = {
  "/": { title: "Dashboard", subtitle: "Daily expense overview" },
  "/transactions": { title: "Transactions", subtitle: "Manage income & expenses" },
  "/payroll": { title: "Payroll", subtitle: "Recurring employee payment tracking" },
  "/notes": { title: "Notes", subtitle: "Shared team notes" },
  "/reports": { title: "Reports", subtitle: "Export your financial data" },
  "/calendar": { title: "Calendar", subtitle: "Shared team notes by date" },
};

export default function Topbar() {
  const { pathname } = useLocation();
  const sidebar = useSidebar();
  const page = titles[pathname] ?? titles["/"];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between gap-4 px-4 sm:px-6 md:h-14 md:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {sidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={sidebar.toggle}
              aria-label="Toggle sidebar"
              className="hidden h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground md:inline-flex"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-semibold text-foreground sm:text-lg">
              {page.title}
            </h2>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{page.subtitle}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
        </div>
      </div>
      <Separator />
    </header>
  );
}
