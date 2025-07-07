
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RevenueComparisonTable } from "@/components/revenue/RevenueComparisonTable";

export default function Revenue() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground">Compare revenue performance across different time periods</p>
        </div>
        
        <RevenueComparisonTable />
        
        {/* Charts and analytics components will be added here */}
      </div>
    </DashboardLayout>
  );
}
