
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Play, Eye, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SamplePayment {
  id: string;
  amount_money: { amount: number; currency: string };
  created_at: string;
  status: string;
  source_type: string;
  location_id: string;
}

interface TransformedData {
  square_payment_id: string;
  venue: string;
  revenue_type: 'bar' | 'door' | 'other';
  amount_cents: number;
  currency: string;
  payment_date: string;
  payment_hour: number;
  payment_day_of_week: number;
  status: string;
}

export const DataProcessingPlayground = () => {
  const [sampleData, setSampleData] = useState<SamplePayment[]>([]);
  const [transformedData, setTransformedData] = useState<TransformedData[]>([]);
  const [revenueEvents, setRevenueEvents] = useState<any[]>([]);

  useEffect(() => {
    loadSampleData();
    loadRevenueEvents();
  }, []);

  const loadSampleData = () => {
    // Generate sample Square payment data for testing
    const samples: SamplePayment[] = [
      {
        id: 'sample_1',
        amount_money: { amount: 850, currency: 'USD' },
        created_at: new Date().toISOString(),
        status: 'COMPLETED',
        source_type: 'CARD',
        location_id: 'loc_123'
      },
      {
        id: 'sample_2',
        amount_money: { amount: 1500, currency: 'USD' },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'COMPLETED',
        source_type: 'CARD',
        location_id: 'loc_123'
      },
      {
        id: 'sample_3',
        amount_money: { amount: 2750, currency: 'USD' },
        created_at: new Date(Date.now() - 7200000).toISOString(),
        status: 'COMPLETED',
        source_type: 'CARD',
        location_id: 'loc_123'
      }
    ];
    setSampleData(samples);
  };

  const loadRevenueEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRevenueEvents(data || []);
    } catch (error) {
      console.error('Error loading revenue events:', error);
    }
  };

  const categorizePayment = (amount: number): 'bar' | 'door' | 'other' => {
    if (amount <= 1500) return 'door';
    if (amount <= 10000) return 'bar';
    return 'other';
  };

  const transformSampleData = () => {
    const transformed = sampleData.map(payment => {
      const paymentDate = new Date(payment.created_at);
      return {
        square_payment_id: payment.id,
        venue: 'default',
        revenue_type: categorizePayment(payment.amount_money.amount),
        amount_cents: payment.amount_money.amount,
        currency: payment.amount_money.currency,
        payment_date: payment.created_at,
        payment_hour: paymentDate.getHours(),
        payment_day_of_week: paymentDate.getDay(),
        status: payment.status.toLowerCase()
      };
    });
    setTransformedData(transformed);
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getRevenueTypeColor = (type: string) => {
    switch (type) {
      case 'bar': return 'bg-green-100 text-green-800';
      case 'door': return 'bg-blue-100 text-blue-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Processing Playground</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transformation" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transformation">Transformation Logic</TabsTrigger>
              <TabsTrigger value="categorization">Revenue Categorization</TabsTrigger>
              <TabsTrigger value="preview">Live Data Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="transformation" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Sample Square Payment Data</h4>
                    <Button onClick={loadSampleData} variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Refresh Samples
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sampleData.map((payment) => (
                      <div key={payment.id} className="p-3 border rounded-lg bg-gray-50">
                        <div className="text-sm font-mono">
                          <div><strong>ID:</strong> {payment.id}</div>
                          <div><strong>Amount:</strong> {formatAmount(payment.amount_money.amount)}</div>
                          <div><strong>Time:</strong> {new Date(payment.created_at).toLocaleString()}</div>
                          <div><strong>Status:</strong> {payment.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Transformed Revenue Events</h4>
                    <Button onClick={transformSampleData} size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Transform Data
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {transformedData.map((event) => (
                      <div key={event.square_payment_id} className="p-3 border rounded-lg bg-green-50">
                        <div className="text-sm font-mono">
                          <div><strong>Payment ID:</strong> {event.square_payment_id}</div>
                          <div><strong>Amount:</strong> {formatAmount(event.amount_cents)}</div>
                          <div><strong>Type:</strong> 
                            <Badge className={`ml-2 ${getRevenueTypeColor(event.revenue_type)}`}>
                              {event.revenue_type}
                            </Badge>
                          </div>
                          <div><strong>Hour:</strong> {event.payment_hour}:00</div>
                          <div><strong>Day:</strong> {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][event.payment_day_of_week]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categorization" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Door Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-blue-700">
                      <p><strong>Criteria:</strong> ≤ $15.00</p>
                      <p><strong>Examples:</strong> Entry fees, cover charges</p>
                      <p><strong>Sample Amount:</strong> $8.50</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-800">Bar Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-green-700">
                      <p><strong>Criteria:</strong> $15.01 - $100.00</p>
                      <p><strong>Examples:</strong> Drinks, food orders</p>
                      <p><strong>Sample Amount:</strong> $27.50</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-800">Other Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-700">
                      <p><strong>Criteria:</strong> {'>'}$100.00</p>
                      <p><strong>Examples:</strong> Special events, merchandise</p>
                      <p><strong>Sample Amount:</strong> $150.00</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Recent Revenue Events (Live Data)</h4>
                <Button onClick={loadRevenueEvents} variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {revenueEvents.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{formatAmount(event.amount_cents)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.payment_date).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getRevenueTypeColor(event.revenue_type)}>
                          {event.revenue_type}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-1">
                          {event.venue}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {revenueEvents.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No revenue events found. Try running a sync first.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
