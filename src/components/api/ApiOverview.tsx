import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings, ExternalLink, Info } from 'lucide-react';
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

export const ApiOverview = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Square',
      status: 'unknown',
      lastChecked: null,
      manageUrl: '/square-sync'
    },
    {
      name: 'Xero',
      status: 'unknown',
      lastChecked: null,
      configureUrl: '/settings?tab=api'
    }
  ]);

  // Check initial connection status on load
  useEffect(() => {
    const checkInitialStatus = async () => {
      // Check Xero connection status
      const tokenCheck = await checkXeroTokens();
      setServices(prev => prev.map(service => 
        service.name === 'Xero' 
          ? { 
              ...service, 
              status: tokenCheck.connected ? 'connected' : 'error',
              lastChecked: new Date(),
              error: tokenCheck.connected ? undefined : tokenCheck.error
            }
          : service
      ));
    };

    checkInitialStatus();
  }, []);

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

  const checkXeroTokens = async () => {
    try {
      const { data: tokens, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('provider_name', 'xero')
        .maybeSingle();

      if (error) throw error;

      if (!tokens) {
        return { connected: false, error: 'No Xero connection found' };
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null;
      
      if (expiresAt && now >= expiresAt) {
        return { connected: false, error: 'Xero token has expired' };
      }

      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Failed to check Xero connection' 
      };
    }
  };

  const testXeroConnection = async () => {
    setServices(prev => prev.map(service => 
      service.name === 'Xero' 
        ? { ...service, status: 'testing' }
        : service
    ));

    try {
      const tokenCheck = await checkXeroTokens();
      
      if (!tokenCheck.connected) {
        setServices(prev => prev.map(service => 
          service.name === 'Xero' 
            ? { 
                ...service, 
                status: 'error',
                lastChecked: new Date(),
                error: tokenCheck.error
              }
            : service
        ));
        toast.error(tokenCheck.error || 'Xero connection failed');
        return;
      }

      // Test actual Xero API connection
      const { data, error } = await supabase.functions.invoke('xero-sync', {
        body: { 
          test_connection_only: true
        }
      });

      if (error) throw error;

      setServices(prev => prev.map(service => 
        service.name === 'Xero' 
          ? { 
              ...service, 
              status: data?.success ? 'connected' : 'error',
              lastChecked: new Date(),
              error: data?.success ? undefined : data?.error || 'API connection failed'
            }
          : service
      ));

      if (data?.success) {
        toast.success('Xero connection successful');
      } else {
        toast.error('Xero API connection failed');
      }
    } catch (error) {
      setServices(prev => prev.map(service => 
        service.name === 'Xero' 
          ? { 
              ...service, 
              status: 'error',
              lastChecked: new Date(),
              error: error instanceof Error ? error.message : 'Connection test failed'
            }
          : service
      ));
      toast.error('Failed to test Xero connection');
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
        <h2 className="text-2xl font-bold text-gm-neutral-900">API Integration Overview</h2>
        <p className="text-gm-neutral-600">Monitor connection health and manage your integrated services</p>
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

                {service.name === 'Xero' && (
                  <Button
                    onClick={testXeroConnection}
                    disabled={service.status === 'testing'}
                    size="sm"
                    className="flex-1"
                    variant="outline"
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

                {service.configureUrl && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link to={service.configureUrl}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
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
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button asChild variant="outline" className="h-auto flex-col py-4">
              <Link to="/square-sync">
                <Settings className="h-6 w-6 mb-2" />
                Square Sync
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-4">
              <Link to="/settings?tab=api">
                <ExternalLink className="h-6 w-6 mb-2" />
                OAuth Setup
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-4">
              <Link to="/revenue">
                <CheckCircle className="h-6 w-6 mb-2" />
                Revenue Data
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-4">
              <Link to="/dashboard">
                <AlertTriangle className="h-6 w-6 mb-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration Status:</strong> Your API integrations transform raw payment data into structured 
          revenue insights. Use the testing tools to verify connections and the data management tools to 
          process transactions.
        </AlertDescription>
      </Alert>
    </div>
  );
};