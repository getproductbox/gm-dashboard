
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface ServiceStatus {
  name: string;
  status: 'connected' | 'error' | 'testing' | 'unknown';
  lastChecked: Date | null;
  error?: string;
  configureUrl?: string;
  manageUrl?: string;
}

export const ApiConnectionStatus = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Square',
      status: 'unknown',
      lastChecked: null,
      manageUrl: '/square-sync'
    }
  ]);

  const testSquareConnection = async () => {
    setServices(prev => prev.map(service => 
      service.name === 'Square' 
        ? { ...service, status: 'testing' }
        : service
    ));

    try {
      const { data, error } = await supabase.functions.invoke('square-sync', {
        body: { 
          environment: 'sandbox',
          test_connection_only: true
        }
      });

      if (error) throw error;

      setServices(prev => prev.map(service => 
        service.name === 'Square' 
          ? { 
              ...service, 
              status: data?.success ? 'connected' : 'error',
              lastChecked: new Date(),
              error: data?.success ? undefined : data?.error || 'Connection failed'
            }
          : service
      ));

      if (data?.success) {
        toast.success('Square connection successful');
      } else {
        toast.error('Square connection failed');
      }
    } catch (error) {
      setServices(prev => prev.map(service => 
        service.name === 'Square' 
          ? { 
              ...service, 
              status: 'error',
              lastChecked: new Date(),
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : service
      ));
      toast.error('Failed to test Square connection');
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gm-neutral-900">API Connection Status</h2>
        <p className="text-gm-neutral-600">Monitor the health and connectivity of your integrated services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(service.status)}
                  <span>{service.name}</span>
                </div>
                {getStatusBadge(service.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gm-neutral-600">
                <p><strong>Last Checked:</strong></p>
                <p>{service.lastChecked ? service.lastChecked.toLocaleString() : 'Never'}</p>
              </div>

              {service.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{service.error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-2">
                {service.name === 'Square' && (
                  <Button
                    onClick={testSquareConnection}
                    disabled={service.status === 'testing'}
                    size="sm"
                    className="flex-1"
                  >
                    {service.status === 'testing' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                )}
                
                {service.manageUrl && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link to={service.manageUrl}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New API Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gm-neutral-600 space-y-2">
            <p>Ready to integrate more services? Common APIs you might want to add:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <div className="p-3 border rounded-lg text-center">
                <div className="font-medium">Stripe</div>
                <div className="text-xs text-gm-neutral-500">Payments</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="font-medium">SendGrid</div>
                <div className="text-xs text-gm-neutral-500">Email</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="font-medium">Twilio</div>
                <div className="text-xs text-gm-neutral-500">SMS</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="font-medium">Custom API</div>
                <div className="text-xs text-gm-neutral-500">Your service</div>
              </div>
            </div>
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Contact your development team to integrate additional APIs and services.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
