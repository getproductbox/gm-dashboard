
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlagsContext } from '@/contexts/FeatureFlagsContext';
import { Settings, Search, RefreshCw, Info, RotateCcw } from 'lucide-react';

export default function FeatureFlags() {
  const { flags, toggleFeature, resetToDefaults, getDefaultValue, hasUserOverride, resetFlagToDefault } = useFeatureFlagsContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFlags = flags.filter(flag =>
    flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ui': return 'bg-blue-100 text-blue-800';
      case 'pages': return 'bg-green-100 text-green-800';
      case 'experimental': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (flag: any) => {
    const isOverridden = hasUserOverride(flag.key);
    const defaultValue = getDefaultValue(flag.key);
    
    if (!isOverridden) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600">
          Default
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-600">
        Override
      </Badge>
    );
  };

  const groupedFlags = filteredFlags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, typeof flags>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gm-neutral-900 flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Feature Flags
            </h1>
            <p className="text-gm-neutral-600">
              Toggle experimental features and UI components on/off
            </p>
          </div>
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset All to Defaults
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Feature Flag Management
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Default:</strong> Using the system default value. 
                  <strong className="ml-4">Override:</strong> You've customized this flag's behavior.
                  Changes are saved locally and persist across sessions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gm-neutral-400" />
          <Input
            placeholder="Search feature flags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Feature Flags by Category */}
        <div className="space-y-6">
          {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize flex items-center gap-2">
                  {category} Features
                  <Badge variant="outline" className={getCategoryColor(category)}>
                    {categoryFlags.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {category === 'ui' && 'User interface components and design changes'}
                  {category === 'pages' && 'Entire page visibility and routing'}
                  {category === 'experimental' && 'Beta features and debugging tools'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryFlags.map((flag) => {
                    const isOverridden = hasUserOverride(flag.key);
                    const defaultValue = getDefaultValue(flag.key);
                    
                    return (
                      <div
                        key={flag.key}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gm-neutral-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gm-neutral-900">
                              {flag.name}
                            </h3>
                            <Badge variant="outline" className={getCategoryColor(flag.category)}>
                              {flag.category}
                            </Badge>
                            {getStatusBadge(flag)}
                          </div>
                          <p className="text-sm text-gm-neutral-600 mb-2">
                            {flag.description}
                          </p>
                          <div className="flex items-center gap-4">
                            <code className="text-xs bg-gm-neutral-100 px-2 py-1 rounded">
                              {flag.key}
                            </code>
                            <span className="text-xs text-gm-neutral-500">
                              Default: {defaultValue ? 'On' : 'Off'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverridden && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resetFlagToDefault(flag.key)}
                              className="h-8 w-8 p-0"
                              title="Reset to default"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                          <Switch
                            checked={flag.enabled}
                            onCheckedChange={() => toggleFeature(flag.key)}
                          />
                          <span className="text-sm text-gm-neutral-500 min-w-[2rem]">
                            {flag.enabled ? 'On' : 'Off'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFlags.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gm-neutral-600">No feature flags match your search.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
