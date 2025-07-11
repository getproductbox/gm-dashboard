import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, AlertCircle, RefreshCw, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface XeroTenant {
  tenant_id: string;
  tenant_name: string;
  tenant_type: string;
  connected_at: string;
  expires_at: string;
}

export const XeroOAuthConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedTenants, setConnectedTenants] = useState<XeroTenant[]>([]);
  const [loading, setLoading] = useState(true);

  const redirectUri = 'https://preview--gm-dashboard.lovable.app/auth/xero/callback';

  const loadConnectedTenants = async () => {
    try {
      const { data: tokens, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('provider_name', 'xero')
        .eq('environment', 'production');

      if (error) throw error;

      const tenants: XeroTenant[] = tokens?.map(token => ({
        tenant_id: token.tenant_id || '',
        tenant_name: `Organization ${token.tenant_id}`,
        tenant_type: 'ORGANISATION',
        connected_at: token.created_at,
        expires_at: token.expires_at || '',
      })) || [];

      setConnectedTenants(tenants);
    } catch (error) {
      console.error('Error loading connected tenants:', error);
      toast.error('Failed to load connected Xero organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnectedTenants();
  }, []);

  const initiateOAuth = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('xero-oauth-initiate', {
        body: {
          environment: 'production',
          redirect_uri: redirectUri,
        }
      });

      if (error) throw error;

      if (data.success) {
        // Redirect to Xero OAuth page
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || 'Failed to initiate OAuth');
      }
    } catch (error) {
      console.error('OAuth initiation error:', error);
      toast.error('Failed to start Xero connection');
      setIsConnecting(false);
    }
  };

  const disconnectTenant = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from('oauth_tokens')
        .delete()
        .eq('provider_name', 'xero')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success('Disconnected from Xero organization');
      loadConnectedTenants();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading Xero connections...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ExternalLink className="h-5 w-5" />
          <span>Xero OAuth Connection</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect to your Xero organization to access accounting data through the Universal API.
            This will redirect you to Xero's secure authentication page.
          </AlertDescription>
        </Alert>

        {connectedTenants.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gm-neutral-500 mb-4">No Xero organizations connected</p>
            <Button 
              onClick={initiateOAuth}
              disabled={isConnecting}
              className="space-x-2"
            >
              {isConnecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              <span>{isConnecting ? 'Connecting...' : 'Connect to Xero'}</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Connected Organizations</h4>
              <Button 
                onClick={initiateOAuth}
                disabled={isConnecting}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Add Another
              </Button>
            </div>

            <div className="space-y-3">
              {connectedTenants.map((tenant) => {
                const isExpired = tenant.expires_at && new Date(tenant.expires_at) <= new Date();
                
                return (
                  <div key={tenant.tenant_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {isExpired ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-medium">{tenant.tenant_name}</span>
                      </div>
                      <Badge variant={isExpired ? "destructive" : "default"}>
                        {isExpired ? 'Expired' : 'Active'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gm-neutral-500">
                        Connected {new Date(tenant.connected_at).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectTenant(tenant.tenant_id)}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-sm text-gm-neutral-500">
          <p><strong>Redirect URI:</strong> {redirectUri}</p>
          <p className="mt-1">Make sure this URL is registered in your Xero app configuration.</p>
        </div>
      </CardContent>
    </Card>
  );
};