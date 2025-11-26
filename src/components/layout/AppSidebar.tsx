
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Users, BarChart3, Settings, CalendarDays, DollarSign, Building, ListChecks, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

import { LastSyncIndicator } from "./LastSyncIndicator";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const financeItems = [
  {
    title: "Revenue",
    url: "/revenue",
    icon: DollarSign,
  },
  {
    title: "Profit & Loss",
    url: "/pnl",
    icon: BarChart3,
  },
];

const operationsItems = [
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Run Sheet",
    url: "/run-sheet",
    icon: ListChecks,
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: CalendarDays,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
];

const settingsItems = [
  {
    title: "Booth Management",
    url: "/booth-management",
    icon: Building,
  },
  {
    title: "Settings", 
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [lastSyncTime, setLastSyncTime] = useState<string | undefined>();

  const fetchLastSyncTime = async () => {
    try {
      // Get the most recent sync time from any location
      const { data, error } = await supabase
        .from('square_location_sync_status')
        .select('last_successful_sync_at')
        .order('last_successful_sync_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data?.last_successful_sync_at) {
        setLastSyncTime(data.last_successful_sync_at);
      }
    } catch (error) {
      console.error('Error fetching last sync time:', error);
    }
  };

  useEffect(() => {
    fetchLastSyncTime();
  }, []);



  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Dashboard - standalone */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link to="/dashboard">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Finance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="space-y-2">
          <ThemeToggle />
          <LastSyncIndicator lastSyncTime={lastSyncTime} onSyncComplete={fetchLastSyncTime} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
