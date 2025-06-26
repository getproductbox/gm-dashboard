
import { SquarePaymentsResponse, SquarePaymentsListParams, SquareConfig } from '@/types/square';

export class SquareService {
  private config: SquareConfig;
  private baseUrl: string;

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

  async listPayments(params?: SquarePaymentsListParams): Promise<SquarePaymentsResponse> {
    const url = new URL(`${this.baseUrl}/v2/payments`);
    
    // Add query parameters if provided
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
  }

  async getPayment(paymentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v2/payments/${paymentId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Square API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  async listLocations(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v2/locations`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Square API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  // Helper method to get payments since a specific timestamp
  async getPaymentsSince(since: string, locationId?: string): Promise<SquarePaymentsResponse> {
    const params: SquarePaymentsListParams = {
      begin_time: since,
      sort_order: 'ASC'
    };

    if (locationId) {
      params.location_id = locationId;
    }

    return this.listPayments(params);
  }

  // Helper method to get payments for a specific date range
  async getPaymentsInRange(startDate: string, endDate: string, locationId?: string): Promise<SquarePaymentsResponse> {
    const params: SquarePaymentsListParams = {
      begin_time: startDate,
      end_time: endDate,
      sort_order: 'ASC'
    };

    if (locationId) {
      params.location_id = locationId;
    }

    return this.listPayments(params);
  }
}

// Utility functions for working with Square data
export const squareUtils = {
  // Convert Square payment to our revenue event format
  transformPaymentToRevenueEvent: (payment: any, venue: string = 'default'): Partial<any> => {
    const paymentDate = new Date(payment.created_at);
    
    return {
      square_payment_id: payment.id,
      venue: venue,
      revenue_type: 'bar', // Default to bar, can be customized based on business logic
      amount_cents: payment.amount_money.amount,
      currency: payment.amount_money.currency,
      payment_date: payment.created_at,
      payment_hour: paymentDate.getHours(),
      payment_day_of_week: paymentDate.getDay(),
      status: payment.status.toLowerCase()
    };
  },

  // Format amount from cents to currency string
  formatAmount: (amountCents: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amountCents / 100);
  },

  // Get readable status text
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

  // Extract card information for display
  getCardInfo: (payment: any): string => {
    if (payment.card_details?.card) {
      const card = payment.card_details.card;
      return `${card.card_brand} ending in ${card.last_4}`;
    }
    return 'Unknown payment method';
  }
};
