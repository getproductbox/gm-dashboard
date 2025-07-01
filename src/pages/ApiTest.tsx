
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Code, ExternalLink } from "lucide-react";
import { ApiConnectionStatus } from "@/components/api/ApiConnectionStatus";
import { GenericApiTester } from "@/components/api/GenericApiTester";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ApiTest() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gm-neutral-900">API Connections</h1>
            <p className="text-gm-neutral-600">Monitor API health and test connections to your integrated services</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/square-sync" className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4" />
              <span>Manage Square Sync</span>
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Service Status</span>
            </TabsTrigger>
            <TabsTrigger value="tester" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>API Tester</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            <ApiConnectionStatus />
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
