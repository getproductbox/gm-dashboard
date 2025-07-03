
import { SquarePaymentsResponse, SquarePaymentsListParams, SquareConfig, SquarePayment } from '@/types/square';
import { supabase } from '@/integrations/supabase/client';

export class SquareService {
  private config: SquareConfig;
  private baseUrl: string;
  private rateLimitDelay: number = 1000; // 1 second delay between requests

  constructor(config: SquareConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.access_token}`,
      'Square-Version': '2024-12-18',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private async rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    try {
      const result = await requestFn();
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        // Rate limited, wait longer and retry
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * 5));
        return requestFn();
      }
      throw error;
    }
  }

  async listPayments(params?: SquarePaymentsListParams): Promise<SquarePaymentsResponse> {
    return this.rateLimitedRequest(async () => {
      const url = new URL(`${this.baseUrl}/v2/payments`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            url.searchParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Square API Error (${response.status}): ${errorText}`);
      }

      return await response.json();
    });
  }

  async getPayment(paymentId: string): Promise<any> {
    return this.rateLimitedRequest(async () => {
      const response = await fetch(`${this.baseUrl}/v2/payments/${paymentId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Square API Error (${response.status}): ${errorText}`);
      }

      return await response.json();
    });
  }

  async listLocations(): Promise<any> {
    return this.rateLimitedRequest(async () => {
      const response = await fetch(`${this.baseUrl}/v2/locations`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Square API Error (${response.status}): ${errorText}`);
      }

      return await response.json();
    });
  }

  async getPaymentsSince(since: string, locationId?: string): Promise<SquarePaymentsResponse> {
    const params: SquarePaymentsListParams = {
      begin_time: since,
      sort_order: 'ASC',
      limit: 100 // Reasonable batch size
    };

    if (locationId) {
      params.location_id = locationId;
    }

    return this.listPayments(params);
  }

  async getPaymentsInRange(startDate: string, endDate: string, locationId?: string): Promise<SquarePaymentsResponse> {
    const params: SquarePaymentsListParams = {
      begin_time: startDate,
      end_time: endDate,
      sort_order: 'ASC',
      limit: 100
    };

    if (locationId) {
      params.location_id = locationId;
    }

    return this.listPayments(params);
  }

  // Method to fetch and store payments incrementally
  async syncPaymentsSince(environment: 'sandbox' | 'production', since?: string): Promise<{
    success: boolean;
    paymentsProcessed: number;
    error?: string;
  }> {
    try {
      // Get last sync time if not provided
      if (!since) {
        const { data: syncStatus } = await supabase
          .from('square_sync_status')
          .select('last_successful_sync')
          .eq('environment', environment)
          .single();

        since = syncStatus?.last_successful_sync || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      }

      const response = await this.getPaymentsSince(since);
      let paymentsProcessed = 0;

      if (response.payments && response.payments.length > 0) {
        // Store raw payments and process them
        for (const payment of response.payments) {
          await this.storeRawPayment(payment);
          await this.transformAndStorePayment(payment);
          paymentsProcessed++;
        }

        // Update sync status
        await supabase
          .from('square_sync_status')
          .update({
            last_successful_sync: new Date().toISOString(),
            last_sync_attempt: new Date().toISOString(),
            sync_status: 'success',
            payments_synced: paymentsProcessed,
            error_message: null
          })
          .eq('environment', environment);
      }

      return { success: true, paymentsProcessed };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update sync status with error
      await supabase
        .from('square_sync_status')
        .update({
          last_sync_attempt: new Date().toISOString(),
          sync_status: 'error',
          error_message: errorMessage
        })
        .eq('environment', environment);

      return { success: false, paymentsProcessed: 0, error: errorMessage };
    }
  }

  private async storeRawPayment(payment: SquarePayment): Promise<void> {
    // Convert SquarePayment to Json by casting it
    const { error } = await supabase
      .from('square_payments_raw')
      .upsert({
        square_payment_id: payment.id,
        raw_response: payment as any, // Cast to any to satisfy Json type
        synced_at: new Date().toISOString()
      }, {
        onConflict: 'square_payment_id'
      });

    if (error) {
      throw new Error(`Failed to store raw payment: ${error.message}`);
    }
  }

  private async transformAndStorePayment(payment: SquarePayment, venue: string = 'default'): Promise<void> {
    const paymentDate = new Date(payment.created_at);
    const revenueType = this.categorizePayment(payment);
    
    const revenueEvent = {
      square_payment_id: payment.id,
      venue: venue,
      revenue_type: revenueType,
      amount_cents: payment.amount_money.amount,
      currency: payment.amount_money.currency,
      payment_date: payment.created_at,
      payment_hour: paymentDate.getHours(),
      payment_day_of_week: paymentDate.getDay(),
      status: payment.status.toLowerCase()
    };

    const { error } = await supabase
      .from('revenue_events')
      .upsert(revenueEvent, {
        onConflict: 'square_payment_id'
      });

    if (error) {
      throw new Error(`Failed to store revenue event: ${error.message}`);
    }
  }

  private categorizePayment(payment: SquarePayment): 'bar' | 'door' | 'other' {
    // Basic categorization logic - can be enhanced based on your business rules
    const amount = payment.amount_money.amount;
    
    // Example logic: smaller amounts might be door charges, larger amounts bar sales
    if (amount <= 1500) { // $15 or less - likely door charge
      return 'door';
    } else if (amount <= 10000) { // $100 or less - likely bar sale
      return 'bar';
    } else {
      return 'other'; // Large amounts might be special events, etc.
    }
  }
}

// Utility functions for working with Square data
export const squareUtils = {
  transformPaymentToRevenueEvent: (payment: SquarePayment, venue: string = 'default') => {
    const paymentDate = new Date(payment.created_at);
    
    return {
      square_payment_id: payment.id,
      venue: venue,
      revenue_type: 'bar' as const,
      amount_cents: payment.amount_money.amount,
      currency: payment.amount_money.currency,
      payment_date: payment.created_at,
      payment_hour: paymentDate.getHours(),
      payment_day_of_week: paymentDate.getDay(),
      status: payment.status.toLowerCase()
    };
  },

  formatAmount: (amountCents: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amountCents / 100);
  },

  getStatusText: (status: string): string => {
    const statusMap: Record<string, string> = {
      'APPROVED': 'Approved',
      'PENDING': 'Pending',
      'COMPLETED': 'Completed',
      'CANCELED': 'Canceled',
      'FAILED': 'Failed'
    };
    return statusMap[status] || status;
  },

  getCardInfo: (payment: SquarePayment): string => {
    if (payment.card_details?.card) {
      const card = payment.card_details.card;
      return `${card.card_brand} ending in ${card.last_4}`;
    }
    return 'Unknown payment method';
  }
};
