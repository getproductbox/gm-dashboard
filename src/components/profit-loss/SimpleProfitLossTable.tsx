import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar } from 'lucide-react';
import { useSimpleProfitLoss } from '@/hooks/useSimpleProfitLoss';
import { formatCurrency } from '@/utils/profitLossUtils';

export const SimpleProfitLossTable = () => {
  const { isLoading, data, fetchData } = useSimpleProfitLoss();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    fetchData(startDate || undefined, endDate || undefined);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchData();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Profit & Loss Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="start-date">Start Date:</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end-date">End Date:</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button onClick={handleFilter} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Filter
            </Button>
            <Button variant="outline" onClick={handleClearFilter}>
              Clear
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading profit & loss data...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No profit & loss data found.</p>
              <p className="text-sm mt-2">
                Data will appear here once Xero sync has been completed and profit & loss events are available.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-gm-neutral-200 dark:border-gm-neutral-700 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Period Start</TableHead>
                    <TableHead>Period End</TableHead>
                    <TableHead>Report Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.account_name}</TableCell>
                      <TableCell>
                        <span className="capitalize">{event.account_type.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{event.category.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell>
                        {event.subcategory && (
                          <span className="capitalize">{event.subcategory.replace('_', ' ')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(event.amount_cents, event.currency)}
                      </TableCell>
                      <TableCell>{event.period_start}</TableCell>
                      <TableCell>{event.period_end}</TableCell>
                      <TableCell>{event.report_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};