import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { ApiSettings } from '@/components/settings/ApiSettings';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gm-neutral-900">Settings</h1>
          <p className="text-gm-neutral-600">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="integrations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="integrations">API Integrations</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="mt-6">
            <ApiSettings />
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
