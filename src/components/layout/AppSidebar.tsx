
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
import { Home, Calendar, Users, BarChart3, Settings, Code, CalendarDays, TestTube, DollarSign, Building, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";

import { LastSyncIndicator } from "./LastSyncIndicator";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Run Sheet",
    url: "/run-sheet",
    icon: ListChecks,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: CalendarDays,
  },
  {
    title: "Booth Management",
    url: "/booth-management",
    icon: Building,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
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
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
