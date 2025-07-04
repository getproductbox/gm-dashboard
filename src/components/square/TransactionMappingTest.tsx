import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Play, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MappingResult {
  success: boolean;
  processed_count: number;
  sample_results: Array<{
    square_payment_id: string;
    venue: string;
    amount_cents: number;
    payment_date: string;
  }>;
  message: string;
}

export const TransactionMappingTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MappingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMappingTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Running transaction mapping test...');
      
      const { data, error } = await supabase.rpc('test_map_all_transactions');
      
      if (error) {
        throw new Error(error.message);
      }

      setResult(data as unknown as MappingResult);
      toast.success(`Successfully mapped ${(data as any).processed_count} transactions`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error('Mapping test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amountCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amountCents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="h-5 w-5" />
          <span>Transaction Mapping Test</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This test will map ALL transactions from the raw payments table to the revenue_events table.
            It will use venue-based mapping (Hippie Door → door, others → bar).
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={runMappingTest} disabled={isLoading} className="w-full">
            {isLoading ? 'Processing...' : 'Map ALL Transactions'}
          </Button>
          
          <Button 
            onClick={async () => {
              setIsLoading(true);
              setError(null);
              setResult(null);
              
              try {
                const { data, error } = await supabase.rpc('test_map_1000_transactions');
                if (error) throw new Error(error.message);
                setResult(data as unknown as MappingResult);
                toast.success(`Successfully mapped ${(data as any).processed_count} transactions`);
              } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMessage);
                toast.error('Mapping test failed');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading} 
            variant="outline" 
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Quick Test 1000 Sync'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {result.processed_count}
                    </div>
                    <div className="text-sm text-gm-neutral-600">Transactions Mapped</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.sample_results?.length || 0}
                    </div>
                    <div className="text-sm text-gm-neutral-600">Sample Results</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.sample_results && result.sample_results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sample Mapped Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.sample_results.map((transaction, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gm-neutral-50 rounded">
                        <div className="space-y-1">
                          <div className="text-sm font-mono text-gm-neutral-700">
                            {transaction.square_payment_id}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{transaction.venue}</Badge>
                            <span className="text-sm text-gm-neutral-600">
                              {new Date(transaction.payment_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-lg font-semibold">
                          {formatAmount(transaction.amount_cents)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};