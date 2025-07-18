
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
import { Home, Calendar, Users, BarChart3, Settings, Code, CalendarDays, TestTube, DollarSign, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { LastSyncIndicator } from "./LastSyncIndicator";
import { ThemeToggle } from "./ThemeToggle";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    flagKey: null, // Dashboard is always visible
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    flagKey: "showCalendar",
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: CalendarDays,
    flagKey: "showBookings",
  },
  {
    title: "Booth Management",
    url: "/booth-management",
    icon: Building,
    flagKey: "showBookings", // Use the same flag as bookings since it's related
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
    flagKey: "showCustomers",
  },
  {
    title: "Revenue",
    url: "/revenue",
    icon: DollarSign,
    flagKey: "showRevenue",
  },
  {
    title: "Profit & Loss",
    url: "/profit-loss",
    icon: BarChart3,
    flagKey: "showRevenue",
  },
  {
    title: "API Connections",
    url: "/api-test",
    icon: TestTube,
    flagKey: "showDeveloperTools",
  },
  {
    title: "Settings", 
    url: "/settings",
    icon: Settings,
    flagKey: "showSettings",
  },
];

export function AppSidebar() {
  const showCalendar = useFeatureFlag('showCalendar');
  const showBookings = useFeatureFlag('showBookings');
  const showCustomers = useFeatureFlag('showCustomers');
  const showRevenue = useFeatureFlag('showRevenue');
  const showDeveloperTools = useFeatureFlag('showDeveloperTools');
  const showSettings = useFeatureFlag('showSettings');

  // Filter menu items based on feature flags
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.flagKey) return true; // Always show items without flags (like Dashboard)
    
    switch (item.flagKey) {
      case 'showCalendar': return showCalendar;
      case 'showBookings': return showBookings;
      case 'showCustomers': return showCustomers;
      case 'showRevenue': return showRevenue;
      case 'showDeveloperTools': return showDeveloperTools;
      case 'showSettings': return showSettings;
      default: return true;
    }
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
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
          <LastSyncIndicator />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
