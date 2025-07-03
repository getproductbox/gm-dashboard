
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Search, Download, Eye, Code } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RawPayment {
  id: string;
  square_payment_id: string;
  raw_response: any;
  synced_at: string;
}

export const RawDataExplorer = () => {
  const [rawPayments, setRawPayments] = useState<RawPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<RawPayment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRawPayments();
  }, []);

  const loadRawPayments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('square_payments_raw')
        .select('*')
        .order('synced_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRawPayments(data || []);
    } catch (error) {
      console.error('Error loading raw payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = rawPayments.filter(payment =>
    payment.square_payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(payment.raw_response).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportData = () => {
    const dataStr = JSON.stringify(filteredPayments, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `square_raw_payments_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Raw Data Explorer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search payments by ID or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={loadRawPayments} variant="outline" disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsList>
              <TabsTrigger value="list">Payment List</TabsTrigger>
              <TabsTrigger value="details">Payment Details</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-2">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedPayment?.id === payment.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium font-mono text-sm">
                          {payment.square_payment_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.synced_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {payment.raw_response?.amount_money ? 
                            formatAmount(payment.raw_response.amount_money.amount) : 
                            'N/A'
                          }
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {payment.raw_response?.status || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPayments.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    {searchTerm ? 'No payments match your search' : 'No raw payment data found'}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {selectedPayment ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Payment Details</h4>
                    <div className="flex space-x-2">
                      <Badge variant="outline">
                        {new Date(selectedPayment.synced_at).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <Code className="h-4 w-4" />
                        <span>Raw Square API Response</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                        {JSON.stringify(selectedPayment.raw_response, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>

                  {selectedPayment.raw_response && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Quick Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div><strong>Payment ID:</strong> {selectedPayment.raw_response.id}</div>
                          <div><strong>Amount:</strong> {selectedPayment.raw_response.amount_money ? formatAmount(selectedPayment.raw_response.amount_money.amount) : 'N/A'}</div>
                          <div><strong>Status:</strong> {selectedPayment.raw_response.status}</div>
                          <div><strong>Source:</strong> {selectedPayment.raw_response.source_type}</div>
                          <div><strong>Created:</strong> {selectedPayment.raw_response.created_at ? new Date(selectedPayment.raw_response.created_at).toLocaleString() : 'N/A'}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Card Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {selectedPayment.raw_response.card_details ? (
                            <>
                              <div><strong>Brand:</strong> {selectedPayment.raw_response.card_details.card?.card_brand || 'N/A'}</div>
                              <div><strong>Last 4:</strong> {selectedPayment.raw_response.card_details.card?.last_4 || 'N/A'}</div>
                              <div><strong>Entry Method:</strong> {selectedPayment.raw_response.card_details.entry_method || 'N/A'}</div>
                              <div><strong>CVV Status:</strong> {selectedPayment.raw_response.card_details.cvv_status || 'N/A'}</div>
                            </>
                          ) : (
                            <div className="text-gray-500">No card details available</div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Select a payment from the list to view details
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
