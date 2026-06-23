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
      <div className="flex h-14 items-center justify-between px-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{page.title}</h2>
          <p className="text-xs text-muted-foreground">{page.subtitle}</p>
        </div>
        <ThemeToggle className="text-muted-foreground hover:text-foreground" />
      </div>
      <Separator />
    </header>
  );
}
