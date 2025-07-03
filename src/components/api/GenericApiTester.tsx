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
    name: 'List Locations',
    method: 'POST',
    description: 'Test Square Locations API - fetches all locations for your account',
    body: {
      test: 'locations',
      environment: 'sandbox'
    },
    expectedEndpoint: 'https://connect.squareup.com/v2/locations'
  },
  {
    name: 'Get Recent Payments',
    method: 'POST',
    description: 'Test Square Payments API - fetches recent payment transactions',
    body: {
      test: 'payments',
      environment: 'sandbox',
      begin_time: '2025-06-20T00:00:00Z',
      limit: 10
    },
    expectedEndpoint: 'https://connect.squareup.com/v2/payments?begin_time=2025-06-20T00:00:00Z&limit=10'
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
      console.log('Running Square API test:', currentTest.name);
      console.log('Test body:', currentTest.body);

      const { data, error } = await supabase.functions.invoke('square-api-test', {
        body: currentTest.body
      });

      const executionTime = Date.now() - startTime;

      let result: ApiTestResult;

      if (error) {
        result = {
          endpoint: `Square API Test: ${currentTest.name}`,
          method: currentTest.method,
          status: null,
          response: null,
          error: error.message,
          timestamp: new Date(),
          duration: executionTime
        };
      } else {
        result = {
          endpoint: data?.url || currentTest.expectedEndpoint,
          method: 'GET', // The actual method used by the edge function
          status: data?.status || null,
          response: data,
          error: data?.success === false ? (data?.error || 'Test failed') : null,
          timestamp: new Date(),
          duration: executionTime
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
        endpoint: `Square API Test: ${currentTest.name}`,
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
            <span>Square API Endpoint Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These tests make actual calls to Square's API through your Supabase edge function. 
              Your Square access tokens are securely stored as Supabase secrets.
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
                  {test.name}
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
            <Label>Square API Endpoint</Label>
            <code className="block p-2 bg-gray-100 rounded text-sm break-all">
              {currentTest.expectedEndpoint}
            </code>
          </div>

          <div className="space-y-2">
            <Label>Request Parameters</Label>
            <div className="bg-gray-100 rounded p-2 text-sm font-mono">
              <pre>{JSON.stringify(currentTest.body, null, 2)}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Headers (Applied by Edge Function)</Label>
            <div className="bg-gray-100 rounded p-2 text-sm font-mono space-y-1">
              <div>Authorization: Bearer [SQUARE_TOKEN]</div>
              <div>Square-Version: 2024-12-18</div>
              <div>Content-Type: application/json</div>
              <div>Accept: application/json</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={runApiTest} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isLoading ? 'Testing...' : `Test ${currentTest.name}`}
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