import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Code, Play, RefreshCw, AlertCircle, CheckCircle, Info, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useApiProviders, useApiProxy } from '@/hooks/useApiProviders';
import { ApiTestResult } from '@/types/api';

export const UniversalApiTester = () => {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [customParams, setCustomParams] = useState<string>('{}');

  const { data: providers, isLoading: providersLoading } = useApiProviders();
  const apiProxy = useApiProxy();

  const currentProvider = providers?.find(p => p.name === selectedProvider);
  const availableEndpoints = currentProvider?.api_endpoints || [];
  const currentEndpoint = availableEndpoints.find(e => e.endpoint_key === selectedEndpoint);

  const runApiTest = async () => {
    if (!selectedProvider || !selectedEndpoint) {
      toast.error('Please select a provider and endpoint');
      return;
    }

    const startTime = Date.now();

    try {
      console.log('Running universal API test:', { selectedProvider, selectedEndpoint, environment });
      
      let queryParams = {};
      try {
        queryParams = JSON.parse(customParams);
      } catch {
        toast.error('Invalid JSON in custom parameters');
        return;
      }

      const response = await apiProxy.mutateAsync({
        provider: selectedProvider,
        endpoint: selectedEndpoint,
        environment,
        query_params: queryParams,
      });

      const executionTime = Date.now() - startTime;

      const result: ApiTestResult = {
        id: crypto.randomUUID(),
        provider: selectedProvider,
        endpoint: selectedEndpoint,
        environment,
        status: response.status || null,
        response: response.data,
        error: response.success === false ? (response.error || 'Request failed') : null,
        timestamp: new Date(),
        duration: executionTime
      };

      setTestResults(prev => [result, ...prev]);
      
      if (response.success) {
        toast.success(`${currentProvider?.display_name} ${selectedEndpoint} test successful`);
      } else {
        toast.error(`${currentProvider?.display_name} ${selectedEndpoint} test failed`);
      }
    } catch (error) {
      const result: ApiTestResult = {
        id: crypto.randomUUID(),
        provider: selectedProvider,
        endpoint: selectedEndpoint,
        environment,
        status: null,
        response: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      setTestResults(prev => [result, ...prev]);
      toast.error('API test failed');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusBadgeVariant = (status: number | null) => {
    if (!status) return "destructive";
    if (status >= 200 && status < 300) return "default";
    if (status >= 400) return "destructive";
    return "secondary";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Universal API Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Test any configured API provider and endpoint through the universal proxy. 
              Configurations and secrets are managed automatically.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>API Provider</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select an API provider" />
              </SelectTrigger>
              <SelectContent>
                {providers?.map((provider) => (
                  <SelectItem key={provider.id} value={provider.name}>
                    {provider.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Endpoint</Label>
            <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint} disabled={!selectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select an endpoint" />
              </SelectTrigger>
              <SelectContent>
                {availableEndpoints.map((endpoint) => (
                  <SelectItem key={endpoint.id} value={endpoint.endpoint_key}>
                    {endpoint.endpoint_key} ({endpoint.method})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Environment</Label>
            <Select value={environment} onValueChange={(value: 'sandbox' | 'production') => setEnvironment(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentEndpoint && (
            <>
              <div className="space-y-2">
                <Label>Endpoint Details</Label>
                <div className="bg-gray-50 rounded p-3 space-y-2">
                  <div className="text-sm"><strong>Method:</strong> {currentEndpoint.method}</div>
                  <div className="text-sm"><strong>Path:</strong> {currentEndpoint.path}</div>
                  {currentEndpoint.description && (
                    <div className="text-sm"><strong>Description:</strong> {currentEndpoint.description}</div>
                  )}
                  <div className="text-sm"><strong>Full URL:</strong> {currentProvider?.base_url}{currentEndpoint.path}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Query Parameters (JSON)</Label>
                <Input
                  value={customParams}
                  onChange={(e) => setCustomParams(e.target.value)}
                  placeholder='{"limit": 10, "begin_time": "2025-01-01T00:00:00Z"}'
                  className="font-mono text-sm"
                />
              </div>
            </>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={runApiTest} 
              disabled={apiProxy.isPending || !selectedProvider || !selectedEndpoint}
            >
              {apiProxy.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {apiProxy.isPending ? 'Testing...' : 'Test API'}
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <p className="text-gm-neutral-500 text-center py-8">No test results yet. Run a test to see results here.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {testResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{result.provider}</Badge>
                      <Badge variant="secondary">{result.endpoint}</Badge>
                      <Badge variant={getStatusBadgeVariant(result.status)}>
                        {result.status || 'Error'}
                      </Badge>
                      <span className="text-sm text-gm-neutral-500">
                        {result.duration}ms
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {result.error ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-xs text-gm-neutral-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gm-neutral-600">
                    {result.environment} environment
                  </div>

                  {result.error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="bg-gm-neutral-50 rounded p-2 max-h-32 overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};