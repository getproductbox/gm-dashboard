export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          booking_type: string
          venue: string
          venue_area: string | null
          karaoke_booth_id: string | null
          booking_date: string
          start_time: string | null
          end_time: string | null
          duration_hours: number | null
          guest_count: number | null
          ticket_quantity: number | null
          ticket_checkins: Json | null
          special_requests: string | null
          status: string
          total_amount: number | null
          payment_status: string | null
          exported_to_megatix: boolean | null
          export_date: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          staff_notes: string | null
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          booking_type: string
          venue: string
          venue_area?: string | null
          karaoke_booth_id?: string | null
          booking_date: string
          start_time?: string | null
          end_time?: string | null
          duration_hours?: number | null
          guest_count?: number | null
          ticket_quantity?: number | null
          ticket_checkins?: Json | null
          special_requests?: string | null
          status?: string
          total_amount?: number | null
          payment_status?: string | null
          exported_to_megatix?: boolean | null
          export_date?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          staff_notes?: string | null
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          booking_type?: string
          venue?: string
          venue_area?: string | null
          karaoke_booth_id?: string | null
          booking_date?: string
          start_time?: string | null
          end_time?: string | null
          duration_hours?: number | null
          guest_count?: number | null
          ticket_quantity?: number | null
          ticket_checkins?: Json | null
          special_requests?: string | null
          status?: string
          total_amount?: number | null
          payment_status?: string | null
          exported_to_megatix?: boolean | null
          export_date?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          staff_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_karaoke_booth_id_fkey"
            columns: ["karaoke_booth_id"]
            isOneToOne: false
            referencedRelation: "karaoke_booths"
            referencedColumns: ["id"]
          }
        ]
      }
      karaoke_booths: {
        Row: {
          id: string
          name: string
          venue: string
          capacity: number | null
          hourly_rate: number | null
          is_available: boolean | null
          maintenance_notes: string | null
          operating_hours_start: string | null
          operating_hours_end: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          venue: string
          capacity?: number | null
          hourly_rate?: number | null
          is_available?: boolean | null
          maintenance_notes?: string | null
          operating_hours_start?: string | null
          operating_hours_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          venue?: string
          capacity?: number | null
          hourly_rate?: number | null
          is_available?: boolean | null
          maintenance_notes?: string | null
          operating_hours_start?: string | null
          operating_hours_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      square_locations: {
        Row: {
          id: string
          square_location_id: string
          location_name: string
          address: string | null
          business_name: string | null
          country: string | null
          currency: string | null
          environment: string
          is_active: boolean
          synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          square_location_id: string
          location_name: string
          address?: string | null
          business_name?: string | null
          country?: string | null
          currency?: string | null
          environment?: string
          is_active?: boolean
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          square_location_id?: string
          location_name?: string
          address?: string | null
          business_name?: string | null
          country?: string | null
          currency?: string | null
          environment?: string
          is_active?: boolean
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenue_events: {
        Row: {
          id: string
          square_payment_id: string
          venue: string
          revenue_type: string
          amount_cents: number
          currency: string
          payment_date: string
          payment_hour: number
          payment_day_of_week: number
          status: string
          processed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          square_payment_id: string
          venue: string
          revenue_type: string
          amount_cents: number
          currency?: string
          payment_date: string
          payment_hour: number
          payment_day_of_week: number
          status?: string
          processed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          square_payment_id?: string
          venue?: string
          revenue_type?: string
          amount_cents?: number
          currency?: string
          payment_date?: string
          payment_hour?: number
          payment_day_of_week?: number
          status?: string
          processed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      square_sync_status: {
        Row: {
          id: string
          environment: string
          sync_status: string
          sync_session_id: string | null
          progress_percentage: number
          payments_fetched: number
          payments_synced: number
          last_sync_attempt: string
          last_successful_sync: string | null
          last_heartbeat: string
          cursor_position: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          environment: string
          sync_status?: string
          sync_session_id?: string | null
          progress_percentage?: number
          payments_fetched?: number
          payments_synced?: number
          last_sync_attempt?: string
          last_successful_sync?: string | null
          last_heartbeat?: string
          cursor_position?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          environment?: string
          sync_status?: string
          sync_session_id?: string | null
          progress_percentage?: number
          payments_fetched?: number
          payments_synced?: number
          last_sync_attempt?: string
          last_successful_sync?: string | null
          last_heartbeat?: string
          cursor_position?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      square_payments_raw: {
        Row: {
          id: string
          square_payment_id: string
          raw_response: Json
          synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          square_payment_id: string
          raw_response: Json
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          square_payment_id?: string
          raw_response?: Json
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_karaoke_booth_availability: {
        Args: {
          booth_id: string
          booking_date: string
          start_time: string
          end_time: string
          exclude_booking_id?: string
        }
        Returns: boolean
      }
      get_monthly_revenue_summary: {
        Args: {
          venue_filter?: string
          month_date?: string
        }
        Returns: {
          month: string
          total_transactions: number
          door_transactions: number
          bar_transactions: number
          door_revenue_cents: number
          bar_revenue_cents: number
          total_revenue_cents: number
        }[]
      }
      get_weekly_revenue_summary: {
        Args: {
          venue_filter?: string
          week_date?: string
        }
        Returns: {
          week_start: string
          total_transactions: number
          door_transactions: number
          bar_transactions: number
          door_revenue_cents: number
          bar_revenue_cents: number
          total_revenue_cents: number
        }[]
      }
      get_yearly_revenue_summary: {
        Args: {
          venue_filter?: string
          year_date?: string
        }
        Returns: {
          year_start: string
          total_transactions: number
          door_transactions: number
          bar_transactions: number
          door_revenue_cents: number
          bar_revenue_cents: number
          total_revenue_cents: number
        }[]
      }
      get_available_weeks: {
        Args: Record<string, never>
        Returns: {
          week_start: string
          week_label: string
        }[]
      }
      transform_recent_synced_transactions: {
        Args: {
          minutes_back?: number
        }
        Returns: {
          success: boolean
          processed_count: number
          total_recent_synced: number
          minutes_back: number
          cutoff_time: string
          sample_results: {
            id: string
            square_payment_id: string
            venue: string
            revenue_type: string
            amount_cents: number
            currency: string
            payment_date: string
            payment_hour: number
            payment_day_of_week: number
            status: string
            processed_at: string
            created_at: string
            updated_at: string
          }[]
          message: string
        }
      }
      transform_last_n_transactions: {
        Args: {
          transaction_count?: number
        }
        Returns: {
          success: boolean
          processed_count: number
          total_available: number
          transaction_count: number
          sample_results: {
            id: string
            square_payment_id: string
            venue: string
            revenue_type: string
            amount_cents: number
            currency: string
            payment_date: string
            payment_hour: number
            payment_day_of_week: number
            status: string
            processed_at: string
            created_at: string
            updated_at: string
          }[]
          message: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

