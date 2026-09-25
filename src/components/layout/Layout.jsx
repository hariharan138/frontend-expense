import { Outlet } from "react-router-dom";
import { DesktopSidebar, SidebarProvider } from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "./MobileBottomNav";

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <DesktopSidebar />

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar — doubles as the mobile header; safe-area padding is a no-op on non-notched screens */}
          <Topbar />

          {/* Main Content Area — extra bottom clearance on mobile so content isn't hidden behind the tab bar */}
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 pb-24 pt-4 sm:px-6 md:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom tab bar — replaces the hamburger menu for a native app feel */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
