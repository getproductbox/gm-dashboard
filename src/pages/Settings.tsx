
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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

        <div className="w-full mt-6">
          <ApiSettings />
        </div>
      </div>
    </DashboardLayout>
  );
}
