
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockApiEndpoints } from '@/data/mockData/settings';
import { useToast } from '@/hooks/use-toast';
import { Copy, Eye, EyeOff, RotateCcw } from 'lucide-react';

export const ApiSettings = () => {
  const [apiKey, setApiKey] = useState('sk_live_1234567890abcdef1234567890abcdef');
  const [showApiKey, setShowApiKey] = useState(false);
  const [endpoints] = useState(mockApiEndpoints);
  const { toast } = useToast();

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "API Key copied",
      description: "The API key has been copied to your clipboard.",
    });
  };

  const handleRegenerateApiKey = () => {
    const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
    toast({
      title: "API Key regenerated",
      description: "A new API key has been generated. Make sure to update your applications.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage your API keys for integrating with external services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Production API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                readOnly
                className="flex-1 font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyApiKey}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRegenerateApiKey}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep your API key secure and don't share it publicly
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">API Usage</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-muted-foreground">requests</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rate Limit</p>
                <p className="text-2xl font-bold">1000</p>
                <p className="text-xs text-muted-foreground">req/hour</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            Monitor the status and performance of your API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Last Checked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((endpoint) => (
                <TableRow key={endpoint.id}>
                  <TableCell className="font-mono text-sm">
                    {endpoint.url}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{endpoint.method}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(endpoint.status)}>
                      {endpoint.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{endpoint.responseTime}ms</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(endpoint.lastChecked).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Configure webhooks to receive real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              placeholder="https://your-domain.com/webhook"
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Events</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="booking.created" defaultChecked />
                <Label htmlFor="booking.created" className="text-sm">booking.created</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="booking.updated" defaultChecked />
                <Label htmlFor="booking.updated" className="text-sm">booking.updated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="customer.created" />
                <Label htmlFor="customer.created" className="text-sm">customer.created</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="payment.processed" defaultChecked />
                <Label htmlFor="payment.processed" className="text-sm">payment.processed</Label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">Test Webhook</Button>
            <Button>Save Webhook</Button>
          </div>
        </CardContent>
      </Card>

      {/* Third-party Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Third-party Integrations</CardTitle>
          <CardDescription>
            Connect with external services and platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Google Calendar</h4>
                <p className="text-sm text-muted-foreground">Sync bookings with Google Calendar</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Stripe</h4>
                <p className="text-sm text-muted-foreground">Process payments</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Mailchimp</h4>
                <p className="text-sm text-muted-foreground">Email marketing automation</p>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Slack</h4>
                <p className="text-sm text-muted-foreground">Team notifications</p>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
