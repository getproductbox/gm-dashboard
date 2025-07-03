import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Code, Play, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number | null;
  response: any;
  error: string | null;
  timestamp: Date;
  duration: number;
}

const squareTests = [
  {
    name: 'Test Connection Status',
    method: 'GET',
    description: 'Check if the Square API connection is working',
    endpoint: '/functions/v1/square-sync'
  },
  {
    name: 'Test Connection Only',
    method: 'POST',
    description: 'Test Square API credentials without syncing data',
    endpoint: '/functions/v1/square-sync',
    body: {
      environment: 'sandbox',
      test_connection_only: true
    }
  }
];

export const GenericApiTester = () => {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<number>(0);

  const currentTest = squareTests[selectedTest];

  const runApiTest = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      let response: any;
      let result: ApiTestResult;

      if (currentTest.method === 'GET') {
        // Use direct fetch for GET requests to the edge function
        const res = await fetch(`https://plksvatjdylpuhjitbfc.supabase.co${currentTest.endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa3N2YXRqZHlscHVoaml0YmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjQ5MzMsImV4cCI6MjA2NjM0MDkzM30.IdM8u1iq88C0ruwp7IkMB7PxwnfwmRyl6uLnBmZq5ys`,
            'Content-Type': 'application/json'
          }
        });

        const responseData = await res.text();
        let parsedResponse;

        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = responseData;
        }

        result = {
          endpoint: `Supabase Edge Function: ${currentTest.endpoint}`,
          method: currentTest.method,
          status: res.status,
          response: parsedResponse,
          error: null,
          timestamp: new Date(),
          duration: Date.now() - startTime
        };

        if (!res.ok) {
          result.error = `HTTP ${res.status}: ${res.statusText}`;
        }
      } else {
        // Use Supabase client for POST requests
        const { data, error } = await supabase.functions.invoke('square-sync', {
          body: currentTest.body
        });

        result = {
          endpoint: `Supabase Edge Function: ${currentTest.endpoint}`,
          method: currentTest.method,
          status: error ? null : 200,
          response: data,
          error: error?.message || null,
          timestamp: new Date(),
          duration: Date.now() - startTime
        };
      }

      setTestResults(prev => [result, ...prev]);
      
      if (!result.error && result.status && result.status >= 200 && result.status < 300) {
        toast.success(`${currentTest.name} successful`);
      } else {
        toast.error(`${currentTest.name} failed`);
      }
    } catch (error) {
      const result: ApiTestResult = {
        endpoint: `Supabase Edge Function: ${currentTest.endpoint}`,
        method: currentTest.method,
        status: null,
        response: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      setTestResults(prev => [result, ...prev]);
      toast.error(`${currentTest.name} failed`);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>Square API Connection Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These tests use your Supabase Edge Function to securely test the Square API connection. 
              The Square access tokens are stored as Supabase secrets and accessed server-side.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="test">Test</Label>
            <select
              id="test"
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              value={selectedTest}
              onChange={(e) => setSelectedTest(Number(e.target.value))}
            >
              {squareTests.map((test, index) => (
                <option key={index} value={index}>
                  {test.method} - {test.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <p className="text-sm text-gm-neutral-600 p-2 bg-gray-50 rounded">
              {currentTest.description}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Endpoint</Label>
            <code className="block p-2 bg-gray-100 rounded text-sm break-all">
              {currentTest.endpoint}
            </code>
          </div>

          {currentTest.body && (
            <div className="space-y-2">
              <Label>Request Body</Label>
              <div className="bg-gray-100 rounded p-2 text-sm font-mono">
                <pre>{JSON.stringify(currentTest.body, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Authentication</Label>
            <div className="text-sm text-gm-neutral-600 p-2 bg-blue-50 rounded">
              Uses Supabase authentication with stored Square API tokens
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={runApiTest} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isLoading ? 'Testing...' : `Run ${currentTest.name}`}
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
  );
};