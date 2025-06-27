
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlagsContext } from '@/contexts/FeatureFlagsContext';
import { Settings, Search, RefreshCw, Info, RotateCcw, Users, User } from 'lucide-react';

export default function FeatureFlags() {
  const { 
    flags, 
    resetToDefaults, 
    getDefaultValue, 
    updateDefaultValue,
    getPersonalValue,
    hasPersonalOverride,
    setPersonalOverride,
    resetPersonalOverride
  } = useFeatureFlagsContext();
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
              Manage default settings for all users and your personal testing overrides
            </p>
          </div>
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset All
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  Dual Toggle System
                </p>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Default (All Users):</strong> Sets what new users see by default</p>
                  <p><strong>Personal Toggle:</strong> Your personal override for testing - doesn't affect other users</p>
                  <p>Personal toggles take precedence over defaults when set.</p>
                </div>
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
                <div className="space-y-6">
                  {categoryFlags.map((flag) => {
                    const defaultValue = getDefaultValue(flag.key);
                    const personalValue = getPersonalValue(flag.key);
                    const hasPersonalOverrideActive = hasPersonalOverride(flag.key);
                    
                    return (
                      <div
                        key={flag.key}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        {/* Flag Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gm-neutral-900">
                              {flag.name}
                            </h3>
                            <Badge variant="outline" className={getCategoryColor(flag.category)}>
                              {flag.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gm-neutral-600 mb-2">
                            {flag.description}
                          </p>
                          <code className="text-xs bg-gm-neutral-100 px-2 py-1 rounded">
                            {flag.key}
                          </code>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Default Setting */}
                          <div className="p-3 border rounded-lg bg-gm-neutral-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gm-neutral-600" />
                                <span className="text-sm font-medium text-gm-neutral-700">
                                  Default (All Users)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={defaultValue}
                                  onCheckedChange={(checked) => updateDefaultValue(flag.key, checked)}
                                />
                                <span className="text-xs text-gm-neutral-500 min-w-[2rem]">
                                  {defaultValue ? 'On' : 'Off'}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gm-neutral-500">
                              What new users see by default
                            </p>
                          </div>

                          {/* Personal Setting */}
                          <div className="p-3 border rounded-lg bg-blue-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">
                                  Personal Toggle
                                </span>
                                {hasPersonalOverrideActive && (
                                  <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                                    Override
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {hasPersonalOverrideActive && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => resetPersonalOverride(flag.key)}
                                    className="h-6 w-6 p-0"
                                    title="Reset to default"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                )}
                                <Switch
                                  checked={personalValue}
                                  onCheckedChange={(checked) => setPersonalOverride(flag.key, checked)}
                                />
                                <span className="text-xs text-gm-neutral-500 min-w-[2rem]">
                                  {personalValue ? 'On' : 'Off'}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gm-neutral-500">
                              {hasPersonalOverrideActive 
                                ? 'Your personal override is active' 
                                : 'Following default setting'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Status Summary */}
                        <div className="flex items-center gap-4 text-xs text-gm-neutral-500 pt-2 border-t">
                          <span>
                            <strong>Currently Active:</strong> {flag.enabled ? 'On' : 'Off'}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Source:</strong> {hasPersonalOverrideActive ? 'Personal Override' : 'Default Setting'}
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
