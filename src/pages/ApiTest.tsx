
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play, RefreshCw, AlertCircle, CheckCircle, CreditCard, Database, Zap, Settings } from "lucide-react";
import { ManualSyncControls } from "@/components/square/ManualSyncControls";
import { DataProcessingPlayground } from "@/components/square/DataProcessingPlayground";
import { RawDataExplorer } from "@/components/square/RawDataExplorer";
import { ProductionSyncControls } from "@/components/square/ProductionSyncControls";

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number | null;
  response: any;
  error: string | null;
  timestamp: Date;
  duration: number;
}

export default function ApiTest() {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState({
    endpoint: '',
    method: 'GET',
    headers: '',
    body: ''
  });

  const runApiTest = async () => {
    if (!currentTest.endpoint) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Parse custom headers if provided
      if (currentTest.headers) {
        try {
          const customHeaders = JSON.parse(currentTest.headers);
          headers = { ...headers, ...customHeaders };
        } catch (e) {
          console.warn('Invalid headers JSON, using defaults');
        }
      }

      const options: RequestInit = {
        method: currentTest.method,
        headers
      };

      if (currentTest.method !== 'GET' && currentTest.body) {
        options.body = currentTest.body;
      }

      const response = await fetch(currentTest.endpoint, options);
      const responseData = await response.text();
      let parsedResponse;

      try {
        parsedResponse = JSON.parse(responseData);
      } catch {
        parsedResponse = responseData;
      }

      const result: ApiTestResult = {
        endpoint: currentTest.endpoint,
        method: currentTest.method,
        status: response.status,
        response: parsedResponse,
        error: null,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      const result: ApiTestResult = {
        endpoint: currentTest.endpoint,
        method: currentTest.method,
        status: null,
        response: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      setTestResults(prev => [result, ...prev]);
    } finally {
      setIsLoading(false);
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

  const setSquareEdgeFunctionTemplate = (template: 'square-sync-sandbox' | 'square-sync-production' | 'square-cron') => {
    const templates = {
      'square-sync-sandbox': {
        endpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-sync',
        method: 'POST',
        headers: '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjQ5MzMsImV4cCI6MjA2NjM0MDkzM30.IdM8u1iq88C0ruwp7IkMB7PxwnfwmRyl6uLnBmZq5ys"}',
        body: '{"environment": "sandbox"}'
      },
      'square-sync-production': {
        endpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-sync',
        method: 'POST',
        headers: '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjQ5MzMsImV4cCI6MjA2NjM0MDkzM30.IdM8u1iq88C0ruwp7IkMB7PxwnfwmRyl6uLnBmZq5ys"}',
        body: '{"environment": "production"}'
      },
      'square-cron': {
        endpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-cron',
        method: 'POST',
        headers: '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjQ5MzMsImV4cCI6MjA2NjM0MDkzM30.IdM8u1iq88C0ruwp7IkMB7PxwnfwmRyl6uLnBmZq5ys"}',
        body: '{}'
      }
    };

    setCurrentTest(templates[template]);
  };

  const setAdvancedSquareTemplate = (template: 'payments-date-range' | 'payments-pagination' | 'location-details' | 'payment-error-test') => {
    const templates = {
      'payments-date-range': {
        endpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-sync',
        method: 'POST',
        headers: '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjQ5MzMsImV4cCI6MjA2NjM0MDkzM30.IdM8u1iq88C0ruwp7IkMB7PxwnfwmRyl6uLnBmZq5ys"}',
        body: `{"environment": "sandbox", "date_range": {"start": "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}", "end": "${new Date().toISOString()}"}}`
      },
      'payments-pagination': {
        endpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-sync',
        method: 'POST',
        headers: '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjQ5MzMsImV4cCI6MjA2NjM0MDkzM30.IdM8u1iq88C0ruwp7IkMB7PxwnfwmRyl6uLnBmZq5ys"}',
        body: '{"environment": "sandbox", "limit": 10, "pagination": true}'
      },
      'location-details': {
        endpoint: 'https://connect.squareupsandbox.com/v2/locations',
        method: 'GET',
        headers: '{"Authorization": "Bearer YOUR_SANDBOX_ACCESS_TOKEN", "Square-Version": "2024-12-18"}',
        body: ''
      },
      'payment-error-test': {
        endpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-sync',
        method: 'POST',
        headers: '{"Authorization": "Bearer invalid_token"}',
        body: '{"environment": "sandbox", "force_error": true}'
      }
    };

    setCurrentTest(templates[template]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gm-neutral-900">Square Developer Tools</h1>
          <p className="text-gm-neutral-600">Comprehensive API testing, sync controls, and data processing tools</p>
        </div>

        <Tabs defaultValue="api-test" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="api-test" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>API Test</span>
            </TabsTrigger>
            <TabsTrigger value="sync-controls" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Manual Sync</span>
            </TabsTrigger>
            <TabsTrigger value="production-sync" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Production Sync</span>
            </TabsTrigger>
            <TabsTrigger value="data-playground" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Data Playground</span>
            </TabsTrigger>
            <TabsTrigger value="raw-explorer" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Raw Data</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-test" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* API Test Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>API Request Builder</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint URL</Label>
                    <Input
                      id="endpoint"
                      placeholder="https://api.example.com/endpoint"
                      value={currentTest.endpoint}
                      onChange={(e) => setCurrentTest(prev => ({ ...prev, endpoint: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="method">HTTP Method</Label>
                    <select
                      id="method"
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                      value={currentTest.method}
                      onChange={(e) => setCurrentTest(prev => ({ ...prev, method: e.target.value }))}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>

                  <Tabs defaultValue="headers" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                      <TabsTrigger value="body">Body</TabsTrigger>
                    </TabsList>
                    <TabsContent value="headers" className="space-y-2">
                      <Label htmlFor="headers">Headers (JSON format)</Label>
                      <textarea
                        id="headers"
                        className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md font-mono text-sm"
                        placeholder='{"Authorization": "Bearer token", "Custom-Header": "value"}'
                        value={currentTest.headers}
                        onChange={(e) => setCurrentTest(prev => ({ ...prev, headers: e.target.value }))}
                      />
                    </TabsContent>
                    <TabsContent value="body" className="space-y-2">
                      <Label htmlFor="body">Request Body</Label>
                      <textarea
                        id="body"
                        className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md font-mono text-sm"
                        placeholder='{"key": "value"}'
                        value={currentTest.body}
                        onChange={(e) => setCurrentTest(prev => ({ ...prev, body: e.target.value }))}
                      />
                    </TabsContent>
                  </Tabs>

                  <div className="flex space-x-2">
                    <Button onClick={runApiTest} disabled={isLoading || !currentTest.endpoint}>
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isLoading ? 'Testing...' : 'Run Test'}
                    </Button>
                    <Button variant="outline" onClick={clearResults}>
                      Clear Results
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Test Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.length === 0 ? (
                    <p className="text-gm-neutral-500 text-center py-8">No test results yet. Run a test to see results here.</p>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {testResults.map((result, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{result.method}</Badge>
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
                          
                          <div className="text-sm font-mono text-gm-neutral-700 break-all">
                            {result.endpoint}
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

            {/* Square Edge Functions Templates */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <span>Square Edge Functions</span>
                </CardTitle>
                <p className="text-sm text-green-700 mt-2">
                  Test your Square integration through Supabase Edge Functions - bypasses CORS issues and tests your actual implementation.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setSquareEdgeFunctionTemplate('square-sync-sandbox')}
                    className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Sandbox Sync</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSquareEdgeFunctionTemplate('square-sync-production')}
                    className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Production Sync</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSquareEdgeFunctionTemplate('square-cron')}
                    className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Cron Function</span>
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Advanced Square API Templates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setAdvancedSquareTemplate('payments-date-range')}
                      className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Date Range Query</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAdvancedSquareTemplate('payments-pagination')}
                      className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
                    >
                      <Database className="h-4 w-4" />
                      <span>Pagination Test</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAdvancedSquareTemplate('location-details')}
                      className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Location Details</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAdvancedSquareTemplate('payment-error-test')}
                      className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>Error Handling Test</span>
                    </Button>
                  </div>
                </div>

                <Alert className="mt-4 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    These templates test your actual Square integration and will work without CORS issues. They use your configured API keys from Supabase secrets.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync-controls">
            <ManualSyncControls />
          </TabsContent>

          <TabsContent value="production-sync">
            <ProductionSyncControls />
          </TabsContent>

          <TabsContent value="data-playground">
            <DataProcessingPlayground />
          </TabsContent>

          <TabsContent value="raw-explorer">
            <RawDataExplorer />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
