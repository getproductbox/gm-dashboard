import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CallbackResult {
  success: boolean;
  message?: string;
  tenants?: Array<{
    tenant_id: string;
    tenant_name: string;
    tenant_type: string;
  }>;
  error?: string;
}

export const XeroOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState<CallbackResult | null>(null);

  const redirectUri = `${window.location.origin}/api-test?tab=xero-callback`;

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setResult({
          success: false,
          error: `OAuth error: ${error}`,
        });
        setProcessing(false);
        return;
      }

      if (!code) {
        setResult({
          success: false,
          error: 'No authorization code received',
        });
        setProcessing(false);
        return;
      }

      try {
        const { data, error: callbackError } = await supabase.functions.invoke('xero-oauth-callback', {
          body: {
            code,
            state,
            environment: 'production',
            redirect_uri: redirectUri,
          }
        });

        if (callbackError) throw callbackError;

        setResult(data);
        
        if (data.success) {
          toast.success(data.message || 'Successfully connected to Xero!');
        } else {
          toast.error(data.error || 'Failed to complete OAuth flow');
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setResult({
          success: false,
          error: errorMessage,
        });
        toast.error('Failed to process OAuth callback');
      } finally {
        setProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, redirectUri]);

  const goBack = () => {
    // Remove callback parameters and go back to main API test page
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('scope');
    url.searchParams.set('tab', 'universal');
    window.location.href = url.toString();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {processing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : result?.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span>Xero OAuth Callback</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {processing ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Processing Xero connection...</p>
              <p className="text-gm-neutral-500">Please wait while we complete the authentication</p>
            </div>
          ) : result ? (
            <>
              {result.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {result.message || 'Successfully connected to Xero!'}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {result.error || 'Failed to connect to Xero'}
                  </AlertDescription>
                </Alert>
              )}

              {result.tenants && result.tenants.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Connected Organizations:</h4>
                  {result.tenants.map((tenant) => (
                    <div key={tenant.tenant_id} className="flex items-center space-x-2 p-2 bg-gm-neutral-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{tenant.tenant_name}</span>
                      <span className="text-sm text-gm-neutral-500">({tenant.tenant_type})</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button onClick={goBack} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to API Testing
                </Button>
              </div>
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No callback data received. Please try the connection process again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};