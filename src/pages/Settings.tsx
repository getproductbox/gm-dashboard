
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSettings } from '@/components/settings/UserSettings';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { ApiSettings } from '@/components/settings/ApiSettings';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gm-neutral-900">Settings</h1>
          <p className="text-gm-neutral-600">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="user">User Settings</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="api">API & Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="user" className="mt-6">
            <UserSettings />
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <SystemSettings />
          </TabsContent>
          
          <TabsContent value="api" className="mt-6">
            <ApiSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
