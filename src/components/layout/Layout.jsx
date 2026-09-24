import { Outlet } from "react-router-dom";
import { DesktopSidebar, MobileSidebarMenu, SidebarProvider } from "./Sidebar";
import Topbar from "./Topbar";
import Logo from "../theme/Logo";

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <DesktopSidebar />

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile Header with Menu — padded for the notch/status bar when installed */}
          <header
            className="flex items-center border-b border-border bg-background px-4 py-2 md:hidden"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
          >
            <MobileSidebarMenu />
            <Logo className="ml-2 h-7 w-7" />
            <h1 className="ml-2 font-display text-lg font-semibold">Vetri Digitals</h1>
          </header>

          {/* Topbar */}
          <Topbar />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div
              className="px-4 py-4 sm:px-6 md:p-6 lg:p-8"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
