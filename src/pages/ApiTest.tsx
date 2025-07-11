
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Settings, Database } from "lucide-react";
import { ApiOverview } from "@/components/api/ApiOverview";
import { ApiTestingHub } from "@/components/api/ApiTestingHub";
import { DataManagement } from "@/components/api/DataManagement";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ApiTest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', value);
    navigate(`/api-test?${newSearchParams.toString()}`, { replace: true });
  };
  

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gm-neutral-900">API Integration Center</h1>
            <p className="text-gm-neutral-600">Monitor, test, and manage your API integrations and data processing pipeline</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>API Testing</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Data Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ApiOverview />
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <ApiTestingHub />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <DataManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
