
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { FinancialKPIs } from "@/components/dashboard/FinancialKPIs";
import { RevenueTimeChart } from "@/components/revenue/RevenueTimeChart";
import { CostPercentageChart } from "@/components/dashboard/CostPercentageChart";
import { OperationalForecast } from "@/components/dashboard/OperationalForecast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { financials, kpis, upcomingBookings, utilization, isLoading, error } = useDashboardData();

  const headerActions = (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh Data
    </Button>
  );

  return (
    <DashboardLayout headerActions={headerActions}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gm-neutral-900 dark:text-white">Dashboard</h1>
          <p className="text-gm-neutral-600 dark:text-gm-neutral-400">
            Financial health and operational outlook.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
            Error loading dashboard: {error}
          </div>
        )}

        {/* Row 1: Financial KPIs */}
        <FinancialKPIs kpis={kpis} isLoading={isLoading} />

        {/* Row 2: Revenue Chart (Existing) */}
        <RevenueTimeChart />

        {/* Row 3: Cost Percentage Chart (New) */}
        <CostPercentageChart data={financials} isLoading={isLoading} />

        {/* Row 4: Operational Forecast */}
        <OperationalForecast 
          bookings={upcomingBookings} 
          utilization={utilization} 
          isLoading={isLoading} 
        />
      </div>
    </DashboardLayout>
  );
}
