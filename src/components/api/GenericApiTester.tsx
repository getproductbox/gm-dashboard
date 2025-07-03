import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Code, Play, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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
    method: 'GET',
    url: 'https://connect.squareup.com/v2/locations'
  },
  {
    name: 'Get Recent Payments',
    method: 'GET', 
    url: 'https://connect.squareup.com/v2/payments?begin_time=2025-06-20T00:00:00Z&limit=10'
  }
];

export const GenericApiTester = () => {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<number>(0);
  const [squareToken, setSquareToken] = useState('');

  const currentTest = squareTests[selectedTest];

  const runApiTest = async () => {
    if (!squareToken.trim()) {
      toast.error('Please enter your Square access token');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const headers = {
        'Authorization': `Bearer ${squareToken}`,
        'Square-Version': '2024-12-18'
      };

      const response = await fetch(currentTest.url, {
        method: currentTest.method,
        headers
      });

      const responseData = await response.text();
      let parsedResponse;

      try {
        parsedResponse = JSON.parse(responseData);
      } catch {
        parsedResponse = responseData;
      }

      const result: ApiTestResult = {
        endpoint: currentTest.url,
        method: currentTest.method,
        status: response.status,
        response: parsedResponse,
        error: null,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      setTestResults(prev => [result, ...prev]);
      
      if (response.ok) {
        toast.success(`${currentTest.name} successful`);
      } else {
        toast.error(`${currentTest.name} failed`);
      }
    } catch (error) {
      const result: ApiTestResult = {
        endpoint: currentTest.url,
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
            <span>Square API Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Get your Square access token from the Square Developer Dashboard. This will test your Square API connection.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="squareToken">Square Access Token</Label>
            <Input
              id="squareToken"
              type="password"
              placeholder="Enter your Square access token"
              value={squareToken}
              onChange={(e) => setSquareToken(e.target.value)}
            />
          </div>

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
            <Label>Test URL</Label>
            <code className="block p-2 bg-gray-100 rounded text-sm break-all">
              {currentTest.url}
            </code>
          </div>

          <div className="space-y-2">
            <Label>Headers</Label>
            <div className="bg-gray-100 rounded p-2 text-sm font-mono">
              <div>Authorization: Bearer [your_token]</div>
              <div>Square-Version: 2024-12-18</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={runApiTest} disabled={isLoading || !squareToken.trim()}>
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