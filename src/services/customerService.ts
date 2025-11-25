import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type CustomerRow = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export interface CustomerFilters {
  search?: string;
  isMember?: boolean;
}

export const customerService = {
  // Get all customers with optional filtering
  async getCustomers(filters?: CustomerFilters): Promise<CustomerRow[]> {
    let query = supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (filters?.isMember !== undefined) {
      query = query.eq('is_member', filters.isMember);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    return data || [];
  },

  // Get specific customer by ID
  async getCustomer(id: string): Promise<CustomerRow> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }

    return data;
  },

  // Create new customer (or member)
  async createCustomer(customer: CustomerInsert): Promise<CustomerRow> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }

    return data;
  },

  // Update existing customer
  async updateCustomer(id: string, updates: CustomerUpdate): Promise<CustomerRow> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      throw new Error(`Failed to update customer: ${error.message}`);
    }

    return data;
  },

  // Helper to get only members
  async getMembers(search?: string): Promise<CustomerRow[]> {
    return this.getCustomers({ isMember: true, search });
  }
};
