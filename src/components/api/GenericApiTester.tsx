
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Play, RefreshCw, AlertCircle, CheckCircle, Copy } from 'lucide-react';
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

interface ApiService {
  name: string;
  baseUrl: string;
  endpoints: Array<{
    name: string;
    method: string;
    path: string;
    sampleBody?: any;
  }>;
  headers: Record<string, string>;
  apiKeyLabel?: string;
  instructions?: string;
}

const apiServices: Record<string, ApiService> = {
  supabaseBackfill: {
    name: 'Square Backfill (Supabase)',
    baseUrl: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/square-backfill',
    endpoints: [
      { name: 'Test Connection', method: 'GET', path: '/test-connection' },
      { 
        name: 'Backfill (Dry Run)', 
        method: 'POST', 
        path: '/backfill',
        sampleBody: {
          startDate: '2025-06-22',
          endDate: '2025-06-27',
          dryRun: true
        }
      },
      { 
        name: 'Backfill (Real)', 
        method: 'POST', 
        path: '/backfill',
        sampleBody: {
          startDate: '2025-06-22',
          endDate: '2025-06-27'
        }
      },
      { name: 'Get Status', method: 'GET', path: '/status' }
    ],
    headers: {
      'Authorization': 'Bearer YOUR_ANON_KEY_HERE',
      'Content-Type': 'application/json'
    },
    apiKeyLabel: 'Supabase Anon Key',
    instructions: 'Get your Supabase anon key from: Settings > API in your Supabase dashboard'
  },
  square: {
    name: 'Square API Direct',
    baseUrl: 'https://connect.squareup.com/v2',
    endpoints: [
      { name: 'List Locations', method: 'GET', path: '/locations' },
      { name: 'List Payments', method: 'GET', path: '/payments' },
      { name: 'Get Application', method: 'GET', path: '/oauth2/token/status' }
    ],
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json',
      'Square-Version': '2024-12-18'
    },
    apiKeyLabel: 'Square Access Token',
    instructions: 'Get your access token from Square Developer Dashboard'
  },
  custom: {
    name: 'Custom API',
    baseUrl: 'https://api.example.com',
    endpoints: [
      { name: 'GET Request', method: 'GET', path: '/endpoint' },
      { name: 'POST Request', method: 'POST', path: '/endpoint' }
    ],
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

export const GenericApiTester = () => {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('supabaseBackfill');
  const [selectedEndpoint, setSelectedEndpoint] = useState<number>(0);
  const [apiKey, setApiKey] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [requestBody, setRequestBody] = useState('');

  const currentService = apiServices[selectedService];
  const currentEndpoint = currentService.endpoints[selectedEndpoint];

  const handleServiceChange = (serviceKey: string) => {
    setSelectedService(serviceKey);
    setSelectedEndpoint(0);
    setApiKey('');
    setRequestBody('');
    setCustomHeaders('');
  };

  const handleEndpointChange = (endpointIndex: number) => {
    setSelectedEndpoint(endpointIndex);
    const endpoint = currentService.endpoints[endpointIndex];
    
    // Auto-fill request body if available
    if (endpoint.sampleBody) {
      setRequestBody(JSON.stringify(endpoint.sampleBody, null, 2));
    } else {
      setRequestBody('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const runApiTest = async () => {
    if (!currentEndpoint) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Build headers
      let headers: Record<string, string> = { ...currentService.headers };
      
      // Update Authorization header with API key
      if (apiKey && headers['Authorization']) {
        headers['Authorization'] = headers['Authorization'].replace(/YOUR_\w+_HERE|Bearer\s+\w+/, `Bearer ${apiKey}`);
      }

      // Add custom headers
      if (customHeaders) {
        try {
          const customHeadersObj = JSON.parse(customHeaders);
          headers = { ...headers, ...customHeadersObj };
        } catch (e) {
          console.warn('Invalid custom headers JSON, using defaults');
        }
      }

      const url = `${currentService.baseUrl}${currentEndpoint.path}`;
      
      const options: RequestInit = {
        method: currentEndpoint.method,
        headers
      };

      if (currentEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const response = await fetch(url, options);
      const responseData = await response.text();
      let parsedResponse;

      try {
        parsedResponse = JSON.parse(responseData);
      } catch {
        parsedResponse = responseData;
      }

      const result: ApiTestResult = {
        endpoint: url,
        method: currentEndpoint.method,
        status: response.status,
        response: parsedResponse,
        error: null,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      setTestResults(prev => [result, ...prev]);
      
      if (response.ok) {
        toast.success(`${currentEndpoint.name} successful`);
      } else {
        toast.error(`${currentEndpoint.name} failed`);
      }
    } catch (error) {
      const result: ApiTestResult = {
        endpoint: `${currentService.baseUrl}${currentEndpoint.path}`,
        method: currentEndpoint.method,
        status: null,
        response: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      setTestResults(prev => [result, ...prev]);
      toast.error(`${currentEndpoint.name} failed`);
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
            <span>API Service Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">API Service</Label>
            <select
              id="service"
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              value={selectedService}
              onChange={(e) => handleServiceChange(e.target.value)}
            >
              {Object.entries(apiServices).map(([key, service]) => (
                <option key={key} value={key}>{service.name}</option>
              ))}
            </select>
          </div>

          {/* Instructions */}
          {currentService.instructions && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {currentService.instructions}
              </AlertDescription>
            </Alert>
          )}

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {currentService.apiKeyLabel || 'API Key'}
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          {/* Endpoint Selection */}
          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint</Label>
            <select
              id="endpoint"
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              value={selectedEndpoint}
              onChange={(e) => handleEndpointChange(Number(e.target.value))}
            >
              {currentService.endpoints.map((endpoint, index) => (
                <option key={index} value={index}>
                  {endpoint.method} - {endpoint.name}
                </option>
              ))}
            </select>
          </div>

          {/* Full URL Display */}
          <div className="space-y-2">
            <Label>Full URL</Label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">
                {currentService.baseUrl}{currentEndpoint.path}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`${currentService.baseUrl}${currentEndpoint.path}`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="headers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
            </TabsList>
            
            <TabsContent value="headers" className="space-y-2">
              <Label htmlFor="headers">Additional Headers (JSON format)</Label>
              <textarea
                id="headers"
                className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md font-mono text-sm"
                placeholder='{"Custom-Header": "value"}'
                value={customHeaders}
                onChange={(e) => setCustomHeaders(e.target.value)}
              />
            </TabsContent>
            
            <TabsContent value="body" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Request Body</Label>
                {currentEndpoint.sampleBody && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRequestBody(JSON.stringify(currentEndpoint.sampleBody, null, 2))}
                  >
                    Use Sample
                  </Button>
                )}
              </div>
              <textarea
                id="body"
                className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md font-mono text-sm"
                placeholder='{"key": "value"}'
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          <div className="flex space-x-2">
            <Button onClick={runApiTest} disabled={isLoading || !currentEndpoint}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isLoading ? 'Testing...' : `Run ${currentEndpoint?.name || 'Test'}`}
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
