
// Square API Payment Object Types
export interface SquarePayment {
  id: string;
  created_at: string;
  updated_at: string;
  amount_money: {
    amount: number;
    currency: string;
  };
  status: 'APPROVED' | 'PENDING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
  delay_duration?: string;
  source_type: 'CARD' | 'BANK_ACCOUNT' | 'WALLET' | 'BUY_NOW_PAY_LATER' | 'CASH' | 'EXTERNAL';
  card_details?: {
    status: string;
    card: {
      card_brand: string;
      last_4: string;
      exp_month?: number;
      exp_year?: number;
      cardholder_name?: string;
      billing_address?: SquareAddress;
    };
    entry_method: string;
    cvv_status?: string;
    avs_status?: string;
    statement_description?: string;
    application_identifier?: string;
    application_name?: string;
    application_cryptogram?: string;
    verification_method?: string;
    verification_results?: string;
  };
  location_id: string;
  order_id?: string;
  reference_id?: string;
  customer_id?: string;
  employee_id?: string;
  refund_ids?: string[];
  risk_evaluation?: {
    created_at: string;
    risk_level: 'PENDING' | 'NORMAL' | 'MODERATE' | 'HIGH';
  };
  buyer_email_address?: string;
  billing_address?: SquareAddress;
  shipping_address?: SquareAddress;
  note?: string;
  statement_description_identifier?: string;
  capabilities?: string[];
  receipt_number?: string;
  receipt_url?: string;
  device_details?: {
    device_id?: string;
    device_installation_id?: string;
    device_name?: string;
  };
  application_details?: {
    square_product: string;
    application_id?: string;
  };
  version_token?: string;
}

export interface SquareAddress {
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  locality?: string;
  sublocality?: string;
  sublocality_2?: string;
  sublocality_3?: string;
  administrative_district_level_1?: string;
  administrative_district_level_2?: string;
  administrative_district_level_3?: string;
  postal_code?: string;
  country?: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
}

// Square API Response Types
export interface SquarePaymentsResponse {
  payments?: SquarePayment[];
  cursor?: string;
  errors?: SquareError[];
}

export interface SquareError {
  category: string;
  code: string;
  detail?: string;
  field?: string;
}

// Database Types for our transformed data
export interface RevenueEvent {
  id: string;
  square_payment_id: string;
  venue: string;
  revenue_type: 'bar' | 'door' | 'other';
  amount_cents: number;
  currency: string;
  payment_date: string;
  payment_hour: number;
  payment_day_of_week: number;
  status: string;
  processed_at: string;
  created_at: string;
  updated_at: string;
}

export interface SquarePaymentRaw {
  id: string;
  square_payment_id: string;
  raw_response: SquarePayment;
  api_version?: string;
  sync_timestamp: string;
  created_at: string;
}

export interface SquareSyncStatus {
  id: string;
  environment: 'sandbox' | 'production';
  last_successful_sync?: string;
  last_sync_attempt?: string;
  sync_status: 'pending' | 'running' | 'success' | 'error';
  error_message?: string;
  payments_synced?: number;
  created_at: string;
  updated_at: string;
}

// Square API Configuration
export interface SquareConfig {
  environment: 'sandbox' | 'production';
  access_token: string;
  application_id?: string;
  location_id?: string;
  webhook_signature_key?: string;
}

// API Request Parameters
export interface SquarePaymentsListParams {
  begin_time?: string;
  end_time?: string;
  sort_order?: 'ASC' | 'DESC';
  cursor?: string;
  location_id?: string;
  total?: number;
  last_4?: string;
  card_brand?: string;
  limit?: number;
}
