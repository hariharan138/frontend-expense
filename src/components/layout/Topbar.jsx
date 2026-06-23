import { useLocation } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";
import { Separator } from "../ui/separator";

const titles = {
  "/": { title: "Dashboard", subtitle: "Daily expense overview" },
  "/transactions": { title: "Transactions", subtitle: "Manage income & expenses" },
  "/reports": { title: "Reports", subtitle: "Export your financial data" },
};

export default function Topbar() {
  const { pathname } = useLocation();
  const page = titles[pathname] ?? titles["/"];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between gap-4 px-4 sm:px-6 md:h-14 md:px-8">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">{page.title}</h2>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{page.subtitle}</p>
        </div>
        <div className="flex-shrink-0">
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
        </div>
      </div>
      <Separator />
    </header>
  );
}
