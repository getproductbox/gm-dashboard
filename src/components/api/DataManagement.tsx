import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Database, MapPin, Hash, Info } from 'lucide-react';
import { useState } from 'react';
import { TwoWeekSyncTest } from '../square/TwoWeekSyncTest';
import { VenueReprocessingControls } from '../square/VenueReprocessingControls';
import { TransactionMappingTest } from '../square/TransactionMappingTest';
import { XeroSyncControls } from '../xero/XeroSyncControls';

export const DataManagement = () => {
  const [squareExpanded, setSquareExpanded] = useState(true);
  const [xeroExpanded, setXeroExpanded] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gm-neutral-900">Data Management & Processing</h2>
        <p className="text-gm-neutral-600">Sync, process, and manage data from your API integrations</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Pipeline:</strong> Raw transaction data flows through these tools: 
          Sync → Venue Mapping → Transaction Processing → Revenue Analytics
        </AlertDescription>
      </Alert>

      {/* Square Data Management */}
      <Collapsible open={squareExpanded} onOpenChange={setSquareExpanded}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Square Data Management</span>
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${squareExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Transaction Sync */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <h3 className="font-medium">Transaction Sync</h3>
                </div>
                <TwoWeekSyncTest />
              </div>

              {/* Venue Mapping */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <h3 className="font-medium">Venue & Location Management</h3>
                </div>
                <VenueReprocessingControls />
              </div>

              {/* Data Processing */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <h3 className="font-medium">Transaction Processing</h3>
                </div>
                <TransactionMappingTest />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Xero Data Management */}
      <Collapsible open={xeroExpanded} onOpenChange={setXeroExpanded}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Xero Data Management</span>
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${xeroExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <XeroSyncControls />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};