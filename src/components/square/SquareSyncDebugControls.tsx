
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bug, Calendar, Play, RefreshCw } from 'lucide-react';
import { useSquareSync } from '@/hooks/useSquareSync';

export const SquareSyncDebugControls = () => {
  const { isLoading, triggerSync } = useSquareSync();
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lastDays, setLastDays] = useState('7');
  const [clearExisting, setClearExisting] = useState(false);

  const handleTestDateRange = async () => {
    if (!startDate || !endDate) {
      alert('Please provide both start and end dates');
      return;
    }

    try {
      await triggerSync(environment, {
        dateRange: { start: startDate, end: endDate },
        clearExisting
      });
    } catch (error) {
      console.error('Test sync failed:', error);
    }
  };

  const handleSyncLastDays = async () => {
    const days = parseInt(lastDays);
    if (isNaN(days) || days <= 0) {
      alert('Please provide a valid number of days');
      return;
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      await triggerSync(environment, {
        dateRange: { 
          start: startDate.toISOString(), 
          end: endDate.toISOString() 
        },
        clearExisting
      });
    } catch (error) {
      console.error('Last days sync failed:', error);
    }
  };

  const setQuickDates = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bug className="h-5 w-5" />
          <span>Debug & Testing Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Bug className="h-4 w-4" />
          <AlertDescription>
            Use these controls to test specific date ranges and debug sync issues. 
            Check the browser console and Edge Function logs for detailed debugging information.
          </AlertDescription>
        </Alert>

        {/* Environment Selection */}
        <div className="space-y-2">
          <Label>Environment</Label>
          <Select value={environment} onValueChange={(value: 'sandbox' | 'production') => setEnvironment(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Existing Data Option */}
        <div className="flex items-center space-x-2">
          <Switch
            id="clear-existing"
            checked={clearExisting}
            onCheckedChange={setClearExisting}
          />
          <Label htmlFor="clear-existing">Clear existing data before sync</Label>
        </div>

        {/* Quick Date Range Selection */}
        <div className="space-y-2">
          <Label>Quick Date Ranges</Label>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setQuickDates(1)}>
              Last 1 Day
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDates(7)}>
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDates(30)}>
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDates(90)}>
              Last 90 Days
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleTestDateRange}
          disabled={isLoading || !startDate || !endDate}
          className="w-full"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4 mr-2" />
          )}
          Test Custom Date Range
        </Button>

        {/* Last N Days Sync */}
        <div className="space-y-2">
          <Label htmlFor="last-days">Sync Last N Days</Label>
          <div className="flex space-x-2">
            <Input
              id="last-days"
              type="number"
              min="1"
              max="365"
              value={lastDays}
              onChange={(e) => setLastDays(e.target.value)}
              placeholder="7"
            />
            <Button
              onClick={handleSyncLastDays}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Sync
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Debugging tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Check browser console for detailed sync parameters</li>
            <li>Monitor Edge Function logs for Square API requests/responses</li>
            <li>Try different date ranges to isolate the issue</li>
            <li>Use "Clear existing data" to ensure fresh sync</li>
            <li>Compare sandbox vs production results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
