
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Code, MapPin, CalendarDays } from "lucide-react";
import { ApiConnectionStatus } from "@/components/api/ApiConnectionStatus";
import { GenericApiTester } from "@/components/api/GenericApiTester";
import { UniversalApiTester } from "@/components/api/UniversalApiTester";
import { VenueReprocessingControls } from "@/components/square/VenueReprocessingControls";
import { TransactionMappingTest } from "@/components/square/TransactionMappingTest";
import { TwoWeekSyncTest } from "@/components/square/TwoWeekSyncTest";

export default function ApiTest() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gm-neutral-900">API Connections</h1>
            <p className="text-gm-neutral-600">Monitor API health and test connections to your integrated services</p>
          </div>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="status" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Service Status</span>
            </TabsTrigger>
            <TabsTrigger value="universal" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>Universal API</span>
            </TabsTrigger>
            <TabsTrigger value="tester" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>Legacy Tester</span>
            </TabsTrigger>
            <TabsTrigger value="sync-test" className="flex items-center space-x-2">
              <CalendarDays className="h-4 w-4" />
              <span>Sync Test</span>
            </TabsTrigger>
            <TabsTrigger value="venues" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Venue Tools</span>
            </TabsTrigger>
            <TabsTrigger value="mapping" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>Data Mapping</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            <ApiConnectionStatus />
          </TabsContent>

          <TabsContent value="universal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Universal API Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gm-neutral-600 mb-6">
                  Test any configured API provider through the universal proxy system. 
                  Automatically handles authentication, configuration, and response normalization.
                </p>
                <UniversalApiTester />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tester" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generic API Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gm-neutral-600 mb-6">
                  Test any REST API endpoint. This is useful for debugging API connections, 
                  testing new integrations, or troubleshooting connectivity issues.
                </p>
                <GenericApiTester />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync-test" className="space-y-6">
            <TwoWeekSyncTest />
          </TabsContent>

          <TabsContent value="venues" className="space-y-6">
            <VenueReprocessingControls />
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            <TransactionMappingTest />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
