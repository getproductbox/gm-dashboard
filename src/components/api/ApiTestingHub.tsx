import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Code, Settings, Info } from 'lucide-react';
import { UniversalApiTester } from './UniversalApiTester';
import { GenericApiTester } from './GenericApiTester';

export const ApiTestingHub = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gm-neutral-900">API Testing Tools</h2>
        <p className="text-gm-neutral-600">Test your integrated APIs and debug connectivity issues</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Use the Universal API Tester for configured providers (Square, Xero) or the Legacy Tester 
          for direct Square API calls. All tests use your securely stored credentials.
        </AlertDescription>
      </Alert>

      {/* Universal API Tester - Primary Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Universal API Testing</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gm-neutral-600 mb-6">
            Test any configured API provider through the universal proxy system. 
            Automatically handles authentication, configuration, and response normalization.
          </p>
          <UniversalApiTester />
        </CardContent>
      </Card>

      {/* Advanced/Legacy Testing - Collapsible */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>Advanced Testing Tools</span>
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Legacy Square API Tester:</strong> Direct testing of Square API endpoints 
                  with predefined test scenarios. Useful for debugging specific Square integration issues.
                </AlertDescription>
              </Alert>
              <GenericApiTester />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};