// Common API interfaces for scalable integration

export interface ApiProvider {
  id: string;
  name: string;
  display_name: string;
  base_url: string;
  auth_type: 'bearer' | 'oauth' | 'api_key' | 'basic';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiEndpoint {
  id: string;
  provider_id: string;
  endpoint_key: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description?: string;
  response_mapper?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiConfiguration {
  id: string;
  provider_id: string;
  environment: 'sandbox' | 'production';
  config_data: {
    headers?: Record<string, string>;
    rate_limit?: {
      requests_per_minute: number;
    };
    [key: string]: any;
  };
  secret_keys?: {
    access_token?: string;
    [key: string]: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ApiRequestParams {
  provider: string;
  endpoint: string;
  environment: 'sandbox' | 'production';
  query_params?: Record<string, string | number>;
  body?: any;
  custom_headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
  provider: string;
  endpoint: string;
  execution_time_ms: number;
  timestamp: string;
}

export interface ApiTestResult {
  id: string;
  provider: string;
  endpoint: string;
  environment: 'sandbox' | 'production';
  status: number | null;
  response: any;
  error: string | null;
  timestamp: Date;
  duration: number;
}

// Provider-specific data types
export interface SquarePayment {
  id: string;
  amount_money: {
    amount: number;
    currency: string;
  };
  location_id: string;
  created_at: string;
  status: string;
}

export interface SquareLocation {
  id: string;
  name: string;
  address?: {
    address_line_1?: string;
    locality?: string;
    administrative_district_level_1?: string;
    postal_code?: string;
    country?: string;
  };
  status: string;
  currency: string;
}

// Normalized data structures
export interface NormalizedPayment {
  id: string;
  amount_cents: number;
  currency: string;
  location_id: string;
  payment_date: string;
  status: string;
  provider: string;
  raw_data: any;
}

export interface NormalizedLocation {
  id: string;
  name: string;
  address?: string;
  status: string;
  currency: string;
  provider: string;
  raw_data: any;
}