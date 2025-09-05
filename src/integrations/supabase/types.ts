export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          booking_source: string | null
          booking_type: string
          created_at: string | null
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          duration_hours: number | null
          end_time: string | null
          export_date: string | null
          exported_to_megatix: boolean | null
          guest_count: number | null
          id: string
          karaoke_booth_id: string | null
          payment_attempted_at: string | null
          payment_completed_at: string | null
          payment_status: string | null
          reference_code: string | null
          special_requests: string | null
          square_payment_id: string | null
          staff_notes: string | null
          start_time: string | null
          status: string
          ticket_checkins: Json | null
          ticket_quantity: number | null
          total_amount: number | null
          updated_at: string | null
          venue: string
          venue_area: string | null
        }
        Insert: {
          booking_date: string
          booking_source?: string | null
          booking_type: string
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          duration_hours?: number | null
          end_time?: string | null
          export_date?: string | null
          exported_to_megatix?: boolean | null
          guest_count?: number | null
          id?: string
          karaoke_booth_id?: string | null
          payment_attempted_at?: string | null
          payment_completed_at?: string | null
          payment_status?: string | null
          reference_code?: string | null
          special_requests?: string | null
          square_payment_id?: string | null
          staff_notes?: string | null
          start_time?: string | null
          status?: string
          ticket_checkins?: Json | null
          ticket_quantity?: number | null
          total_amount?: number | null
          updated_at?: string | null
          venue: string
          venue_area?: string | null
        }
        Update: {
          booking_date?: string
          booking_source?: string | null
          booking_type?: string
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          duration_hours?: number | null
          end_time?: string | null
          export_date?: string | null
          exported_to_megatix?: boolean | null
          guest_count?: number | null
          id?: string
          karaoke_booth_id?: string | null
          payment_attempted_at?: string | null
          payment_completed_at?: string | null
          payment_status?: string | null
          reference_code?: string | null
          special_requests?: string | null
          square_payment_id?: string | null
          staff_notes?: string | null
          start_time?: string | null
          status?: string
          ticket_checkins?: Json | null
          ticket_quantity?: number | null
          total_amount?: number | null
          updated_at?: string | null
          venue?: string
          venue_area?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_karaoke_booth_id_fkey"
            columns: ["karaoke_booth_id"]
            isOneToOne: false
            referencedRelation: "karaoke_booths"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          booking_id: string | null
          created_at: string | null
          error: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          status: string
          template: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          status: string
          template: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          html: string
          name: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          html: string
          name: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          html?: string
          name?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      karaoke_booth_holds: {
        Row: {
          booking_date: string
          booking_id: string | null
          booth_id: string
          created_at: string | null
          customer_email: string | null
          end_time: string
          expires_at: string
          id: string
          session_id: string
          start_time: string
          status: string
          updated_at: string | null
          venue: string
        }
        Insert: {
          booking_date: string
          booking_id?: string | null
          booth_id: string
          created_at?: string | null
          customer_email?: string | null
          end_time: string
          expires_at?: string
          id?: string
          session_id: string
          start_time: string
          status?: string
          updated_at?: string | null
          venue: string
        }
        Update: {
          booking_date?: string
          booking_id?: string | null
          booth_id?: string
          created_at?: string | null
          customer_email?: string | null
          end_time?: string
          expires_at?: string
          id?: string
          session_id?: string
          start_time?: string
          status?: string
          updated_at?: string | null
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "karaoke_booth_holds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karaoke_booth_holds_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "karaoke_booths"
            referencedColumns: ["id"]
          },
        ]
      }
      karaoke_booths: {
        Row: {
          capacity: number | null
          created_at: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          maintenance_notes: string | null
          name: string
          operating_hours_end: string | null
          operating_hours_start: string | null
          updated_at: string | null
          venue: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          maintenance_notes?: string | null
          name: string
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          updated_at?: string | null
          venue: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          maintenance_notes?: string | null
          name?: string
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          updated_at?: string | null
          venue?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          door_ticket_qty: number | null
          line_items: Json | null
          location_id: string | null
          order_created_at: string | null
          order_id: string
          order_updated_at: string | null
          payment_id: string | null
          status: string | null
          synced_at: string | null
          total_money_cents: number | null
          venue: string | null
        }
        Insert: {
          door_ticket_qty?: number | null
          line_items?: Json | null
          location_id?: string | null
          order_created_at?: string | null
          order_id: string
          order_updated_at?: string | null
          payment_id?: string | null
          status?: string | null
          synced_at?: string | null
          total_money_cents?: number | null
          venue?: string | null
        }
        Update: {
          door_ticket_qty?: number | null
          line_items?: Json | null
          location_id?: string | null
          order_created_at?: string | null
          order_id?: string
          order_updated_at?: string | null
          payment_id?: string | null
          status?: string | null
          synced_at?: string | null
          total_money_cents?: number | null
          venue?: string | null
        }
        Relationships: []
      }
      revenue_event_items: {
        Row: {
          category: string | null
          created_at: string | null
          event_id: string
          id: number
          is_comp: boolean | null
          is_refund: boolean | null
          name: string | null
          occurred_at: string | null
          quantity: number
          total_amount_cents: number | null
          unit_amount_cents: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          event_id: string
          id?: number
          is_comp?: boolean | null
          is_refund?: boolean | null
          name?: string | null
          occurred_at?: string | null
          quantity?: number
          total_amount_cents?: number | null
          unit_amount_cents?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          event_id?: string
          id?: number
          is_comp?: boolean | null
          is_refund?: boolean | null
          name?: string | null
          occurred_at?: string | null
          quantity?: number
          total_amount_cents?: number | null
          unit_amount_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_event_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "revenue_events"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_events: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          payment_date: string
          payment_day_of_week: number
          payment_hour: number
          processed_at: string
          revenue_type: string
          square_payment_id: string
          status: string
          updated_at: string
          venue: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          payment_date: string
          payment_day_of_week: number
          payment_hour: number
          processed_at?: string
          revenue_type: string
          square_payment_id: string
          status?: string
          updated_at?: string
          venue: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          payment_date?: string
          payment_day_of_week?: number
          payment_hour?: number
          processed_at?: string
          revenue_type?: string
          square_payment_id?: string
          status?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_events_square_payment_id_fkey"
            columns: ["square_payment_id"]
            isOneToOne: true
            referencedRelation: "square_payments_raw"
            referencedColumns: ["square_payment_id"]
          },
        ]
      }
      square_locations: {
        Row: {
          address: string | null
          business_name: string | null
          country: string | null
          created_at: string
          currency: string | null
          environment: string
          id: string
          is_active: boolean
          location_name: string
          square_location_id: string
          synced_at: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          location_name: string
          square_location_id: string
          synced_at?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          location_name?: string
          square_location_id?: string
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      square_orders_raw: {
        Row: {
          location_id: string | null
          order_id: string
          raw_response: Json
          synced_at: string | null
        }
        Insert: {
          location_id?: string | null
          order_id: string
          raw_response: Json
          synced_at?: string | null
        }
        Update: {
          location_id?: string | null
          order_id?: string
          raw_response?: Json
          synced_at?: string | null
        }
        Relationships: []
      }
      square_payments_raw: {
        Row: {
          id: string
          raw_response: Json
          square_payment_id: string
          synced_at: string
        }
        Insert: {
          id?: string
          raw_response: Json
          square_payment_id: string
          synced_at?: string
        }
        Update: {
          id?: string
          raw_response?: Json
          square_payment_id?: string
          synced_at?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id: string
          last_name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_attendance_by_day: {
        Row: {
          attendance: number | null
          day: string | null
          venue: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _upsert_revenue_event: {
        Args: { p_raw: Json }
        Returns: undefined
      }
      add_missing_locations_from_payments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      get_available_karaoke_booths: {
        Args: {
          p_booking_date: string
          p_end_time: string
          p_min_capacity: number
          p_start_time: string
          p_venue: string
        }
        Returns: {
          capacity: number
          hourly_rate: number
          id: string
          name: string
        }[]
      }
      get_available_weeks: {
        Args: Record<PropertyKey, never>
        Returns: {
          week_label: string
          week_start: string
        }[]
      }
      get_karaoke_booth_availability: {
        Args:
          | {
              booking_date: string
              booth_id: string
              end_time: string
              exclude_booking_id?: string
              start_time: string
            }
          | {
              booking_date: string
              booth_id: string
              end_time: string
              start_time: string
            }
        Returns: boolean
      }
      get_monthly_revenue_summary: {
        Args: { month_date?: string; venue_filter?: string }
        Returns: {
          bar_revenue_cents: number
          bar_transactions: number
          door_revenue_cents: number
          door_transactions: number
          month: string
          total_revenue_cents: number
          total_transactions: number
        }[]
      }
      get_weekly_attendance_summary: {
        Args: { venue_filter?: string; week_date?: string }
        Returns: {
          total_attendance: number
          week_start: string
        }[]
      }
      get_weekly_revenue_summary: {
        Args: { venue_filter?: string; week_date?: string }
        Returns: {
          bar_revenue_cents: number
          bar_transactions: number
          door_revenue_cents: number
          door_transactions: number
          total_revenue_cents: number
          total_transactions: number
          week_start: string
        }[]
      }
      get_yearly_revenue_summary: {
        Args: { venue_filter?: string; year_date?: string }
        Returns: {
          bar_revenue_cents: number
          bar_transactions: number
          door_revenue_cents: number
          door_transactions: number
          total_revenue_cents: number
          total_transactions: number
          year_start: string
        }[]
      }
      karaoke_expire_due_holds: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_payments_batch: {
        Args: { days_back?: number; payment_ids?: string[] }
        Returns: {
          error_count: number
          processed_count: number
          total_payments: number
        }[]
      }
      reprocess_venues_batch: {
        Args: { days_back?: number }
        Returns: Json
      }
      reset_stuck_sync_states: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_square_locations: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_map_100_transactions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_map_1000_transactions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_map_all_transactions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      transform_recent_synced_transactions: {
        Args: { minutes_back?: number }
        Returns: Json
      }
      transform_square_orders_to_normalized: {
        Args: { p_limit?: number }
        Returns: number
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const