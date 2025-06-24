
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { mockSystemSettings } from '@/data/mockData/settings';
import { useToast } from '@/hooks/use-toast';

export const SystemSettings = () => {
  const [settings, setSettings] = useState(mockSystemSettings);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "System settings saved",
      description: "System configuration has been updated successfully.",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* General System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General System</CardTitle>
          <CardDescription>
            Configure general system behavior and maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Put the system into maintenance mode to prevent new bookings
              </p>
            </div>
            <div className="flex items-center gap-2">
              {settings.maintenanceMode && (
                <Badge variant="destructive">Active</Badge>
              )}
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>User Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register accounts
              </p>
            </div>
            <Switch
              checked={settings.registrationEnabled}
              onCheckedChange={(checked) => updateSetting('registrationEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload Settings */}
      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>
            Configure file upload limits and allowed types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxFileSize">Maximum File Size</Label>
            <div className="flex items-center gap-2">
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize / 1024 / 1024}
                onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">MB</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Current limit: {formatFileSize(settings.maxFileSize)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Allowed File Types</Label>
            <div className="flex flex-wrap gap-2">
              {settings.allowedFileTypes.map((type, index) => (
                <Badge key={index} variant="outline">
                  {type}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Files with these extensions can be uploaded
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Configure user session behavior and timeouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout</Label>
            <div className="flex items-center gap-2">
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout / 60}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) * 60)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Current timeout: {formatTime(settings.sessionTimeout)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
          <CardDescription>
            Perform system maintenance and data operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline">Clear Cache</Button>
            <Button variant="outline">Rebuild Search Index</Button>
            <Button variant="outline">Export System Logs</Button>
            <Button variant="outline">Run Diagnostics</Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm">Reset All Settings</Button>
              <Button variant="destructive" size="sm">Purge Old Data</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save System Settings</Button>
      </div>
    </div>
  );
};
