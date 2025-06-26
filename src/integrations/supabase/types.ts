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
          booking_date: string
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
          payment_status: string | null
          special_requests: string | null
          staff_notes: string | null
          start_time: string | null
          status: string
          ticket_quantity: number | null
          total_amount: number | null
          updated_at: string | null
          venue: string
          venue_area: string | null
        }
        Insert: {
          booking_date: string
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
          payment_status?: string | null
          special_requests?: string | null
          staff_notes?: string | null
          start_time?: string | null
          status?: string
          ticket_quantity?: number | null
          total_amount?: number | null
          updated_at?: string | null
          venue: string
          venue_area?: string | null
        }
        Update: {
          booking_date?: string
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
          payment_status?: string | null
          special_requests?: string | null
          staff_notes?: string | null
          start_time?: string | null
          status?: string
          ticket_quantity?: number | null
          total_amount?: number | null
          updated_at?: string | null
          venue?: string
          venue_area?: string | null
        }
        Relationships: []
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
      square_payments_raw: {
        Row: {
          api_version: string | null
          created_at: string
          id: string
          raw_response: Json
          square_payment_id: string
          sync_timestamp: string
        }
        Insert: {
          api_version?: string | null
          created_at?: string
          id?: string
          raw_response: Json
          square_payment_id: string
          sync_timestamp?: string
        }
        Update: {
          api_version?: string | null
          created_at?: string
          id?: string
          raw_response?: Json
          square_payment_id?: string
          sync_timestamp?: string
        }
        Relationships: []
      }
      square_sync_status: {
        Row: {
          created_at: string
          environment: string
          error_message: string | null
          id: string
          last_successful_sync: string | null
          last_sync_attempt: string | null
          payments_synced: number | null
          sync_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          environment: string
          error_message?: string | null
          id?: string
          last_successful_sync?: string | null
          last_sync_attempt?: string | null
          payments_synced?: number | null
          sync_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          environment?: string
          error_message?: string | null
          id?: string
          last_successful_sync?: string | null
          last_sync_attempt?: string | null
          payments_synced?: number | null
          sync_status?: string
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
