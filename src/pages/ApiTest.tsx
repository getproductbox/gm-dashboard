
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Play, RefreshCw, AlertCircle, CheckCircle, Zap } from "lucide-react";

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

  const setSquareTemplate = (template: 'sandbox' | 'production' | 'cron') => {
    const templates = {
      'sandbox': {
        endpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-sync',
        method: 'POST',
        headers: '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjQ5MzMsImV4cCI6MjA2NjM0MDkzM30.IdM8u1iq88C0ruwp7IkMB7PxwnfwmRyl6uLnBmZq5ys"}',
        body: '{"environment": "sandbox"}'
      },
      'production': {
        endpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-sync',
        method: 'POST',
        headers: '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjQ5MzMsImV4cCI6MjA2NjM0MDkzM30.IdM8u1iq88C0ruwp7IkMB7PxwnfwmRyl6uLnBmZq5ys"}',
        body: '{"environment": "production"}'
      },
      'cron': {
        endpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-cron',
        method: 'POST',
        headers: '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjQ5MzMsImV4cCI6MjA2NjM0MDkzM30.IdM8u1iq88C0ruwp7IkMB7PxwnfwmRyl6uLnBmZq5ys"}',
        body: '{}'
      }
    };

    setCurrentTest(templates[template]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gm-neutral-900">API Testing</h1>
          <p className="text-gm-neutral-600">Test API endpoints and Square integration functions</p>
        </div>

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

              <div className="space-y-2">
                <Label htmlFor="headers">Headers (JSON format)</Label>
                <textarea
                  id="headers"
                  className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md font-mono text-sm"
                  placeholder='{"Authorization": "Bearer token"}'
                  value={currentTest.headers}
                  onChange={(e) => setCurrentTest(prev => ({ ...prev, headers: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Request Body</Label>
                <textarea
                  id="body"
                  className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md font-mono text-sm"
                  placeholder='{"key": "value"}'
                  value={currentTest.body}
                  onChange={(e) => setCurrentTest(prev => ({ ...prev, body: e.target.value }))}
                />
              </div>

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

        {/* Square Templates */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span>Square Integration Templates</span>
            </CardTitle>
            <p className="text-sm text-green-700 mt-2">
              Quick templates for testing Square integration functions
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => setSquareTemplate('sandbox')}
                className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
              >
                <Zap className="h-4 w-4" />
                <span>Sandbox Sync</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setSquareTemplate('production')}
                className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
              >
                <Zap className="h-4 w-4" />
                <span>Production Sync</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setSquareTemplate('cron')}
                className="flex items-center space-x-2 border-green-300 hover:bg-green-100"
              >
                <Zap className="h-4 w-4" />
                <span>Cron Function</span>
              </Button>
            </div>

            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                These templates will populate the form above with the correct Square API endpoints and authentication.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
