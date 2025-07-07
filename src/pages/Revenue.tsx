
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Revenue() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground">Charts and analytics will go here</p>
        </div>
        
        {/* Charts and analytics components will be added here */}
      </div>
    </DashboardLayout>
  );
}
