
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function DashboardLayout({ children, headerActions }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <nav className="flex items-center space-x-2 text-sm text-gm-neutral-500">
                <span>GM Staff Portal</span>
                <span>/</span>
                <span className="text-gm-neutral-900">Dashboard</span>
              </nav>
            </div>
            {headerActions && (
              <div className="flex items-center space-x-4">
                {headerActions}
              </div>
            )}
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
