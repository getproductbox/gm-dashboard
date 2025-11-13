import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPnl, type PnlResponse } from '@/services/xeroService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const today = new Date();
const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0,10);
const endOfYear = new Date(today.getFullYear(), 11, 31).toISOString().slice(0,10);

export default function ProfitAndLoss() {
  const [startDate, setStartDate] = React.useState<string>(startOfYear);
  const [endDate, setEndDate] = React.useState<string>(endOfYear);
  const [params, setParams] = React.useState<{start: string; end: string; refresh?: boolean}>({ start: startOfYear, end: endOfYear });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<PnlResponse, Error>({
    queryKey: ['pnl', params.start, params.end, params.refresh ? 'refresh' : 'cache'],
    queryFn: () => fetchPnl(params.start, params.end, params.refresh),
  });

  const onRun = () => setParams({ start: startDate, end: endDate });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profit &amp; Loss</h1>
          <p className="text-muted-foreground">Pulls from Xero Accounting Reports P&amp;L</p>
        </div>

        <Card className="p-4 flex gap-3 items-end w-full max-w-2xl">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Start date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">End date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button onClick={onRun} disabled={isFetching}>Run</Button>
          <Button variant="outline" onClick={() => setParams({ start: startDate, end: endDate, refresh: true })} disabled={isFetching}>
            Refresh from Xero
          </Button>
          {data?.meta?.lastUpdated && (
            <div className="ml-auto text-sm text-muted-foreground">
              Last updated: {new Date(data.meta.lastUpdated).toLocaleString()}
              {data?.meta?.cached ? ' (cached)' : ''}
            </div>
          )}
        </Card>

        {isLoading && <div>Loading P&amp;L…</div>}
        {isError && <div className="text-red-600">{error.message}</div>}

        {data && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Income</div>
              <div className="text-2xl font-semibold">${data.totals.income.toLocaleString()}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Expenses</div>
              <div className="text-2xl font-semibold">${data.totals.expenses.toLocaleString()}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Net Profit</div>
              <div className="text-2xl font-semibold">${data.totals.netProfit.toLocaleString()}</div>
            </Card>

            <Card className="p-4 md:col-span-3">
              <div className="text-sm font-medium mb-2">Categories</div>
              <div className="space-y-1">
                {Object.entries(data.categories).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <div className="capitalize">{k}</div>
                    <div>${v.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}



