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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          adults: number
          breakfast_count: number
          check_in: string
          check_in_time: string
          check_out: string
          check_out_time: string
          children: number
          created_at: string
          created_by: string | null
          guest_name: string
          guests: Json
          id: string
          infants: number
          notes: string | null
          pets: number
          lunch_count: number
          phone: string | null
          room_number: number
          status: string
          updated_at: string
        }
        Insert: {
          adults?: number
          breakfast_count?: number
          check_in: string
          check_in_time?: string
          check_out: string
          check_out_time?: string
          children?: number
          created_at?: string
          created_by?: string | null
          guest_name: string
          guests?: Json
          id?: string
          infants?: number
          notes?: string | null
          pets?: number
          lunch_count?: number
          phone?: string | null
          room_number: number
          status?: string
          updated_at?: string
        }
        Update: {
          adults?: number
          breakfast_count?: number
          check_in?: string
          check_in_time?: string
          check_out?: string
          check_out_time?: string
          children?: number
          created_at?: string
          created_by?: string | null
          guest_name?: string
          guests?: Json
          id?: string
          infants?: number
          notes?: string | null
          pets?: number
          lunch_count?: number
          phone?: string | null
          room_number?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          created_at: string
          id: string
          min_stock: number
          name: string
          quantity: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      food_settings: {
        Row: {
          breakfast_price: number
          created_at: string
          id: number
          lunch_price: number
          updated_at: string
        }
        Insert: {
          breakfast_price?: number
          created_at?: string
          id?: number
          lunch_price?: number
          updated_at?: string
        }
        Update: {
          breakfast_price?: number
          created_at?: string
          id?: number
          lunch_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      food_bills: {
        Row: {
          booking_id: string
          breakfast_count: number
          breakfast_price: number
          breakfast_total: number
          generated_at: string
          guest_name: string
          id: string
          lunch_count: number
          lunch_price: number
          lunch_total: number
          order_date: string
          room_number: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          breakfast_count?: number
          breakfast_price?: number
          breakfast_total?: number
          generated_at?: string
          guest_name: string
          id?: string
          lunch_count?: number
          lunch_price?: number
          lunch_total?: number
          order_date?: string
          room_number: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          breakfast_count?: number
          breakfast_price?: number
          breakfast_total?: number
          generated_at?: string
          guest_name?: string
          id?: string
          lunch_count?: number
          lunch_price?: number
          lunch_total?: number
          order_date?: string
          room_number?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_bills_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_tasks: {
        Row: {
          bathroom_cleaned: boolean
          coffee_refilled: boolean
          id: string
          room_cleaned: boolean
          room_number: number
          tea_bags_refilled: boolean
          updated_at: string
        }
        Insert: {
          bathroom_cleaned?: boolean
          coffee_refilled?: boolean
          id?: string
          room_cleaned?: boolean
          room_number: number
          tea_bags_refilled?: boolean
          updated_at?: string
        }
        Update: {
          bathroom_cleaned?: boolean
          coffee_refilled?: boolean
          id?: string
          room_cleaned?: boolean
          room_number?: number
          tea_bags_refilled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          image_url: string
          name: string
          number: number
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string
          name: string
          number: number
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          name?: string
          number?: number
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          contact: string
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          contact?: string
          created_at?: string
          id?: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          contact?: string
          created_at?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          progress: number
          quantity: number
          room_number: number | null
          staff_member_id: string
          staff_name_snapshot: string
          status: string
          updated_at: string
          work_type: string
        }
        Insert: {
          assigned_by?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          progress?: number
          quantity: number
          room_number?: number | null
          staff_member_id: string
          staff_name_snapshot: string
          status?: string
          updated_at?: string
          work_type: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          progress?: number
          quantity?: number
          room_number?: number | null
          staff_member_id?: string
          staff_name_snapshot?: string
          status?: string
          updated_at?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      laundry_records: {
        Row: {
          id: string
          date_given: string
          date_taken: string | null
          bedsheets_given: number
          bedsheets_taken: number | null
          pillow_covers_given: number
          pillow_covers_taken: number | null
          towels_given: number
          towels_taken: number | null
          blankets_given: number
          blankets_taken: number | null
          created_at: string
        }
        Insert: {
          id?: string
          date_given: string
          date_taken?: string | null
          bedsheets_given?: number
          bedsheets_taken?: number | null
          pillow_covers_given?: number
          pillow_covers_taken?: number | null
          towels_given?: number
          towels_taken?: number | null
          blankets_given?: number
          blankets_taken?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          date_given?: string
          date_taken?: string | null
          bedsheets_given?: number
          bedsheets_taken?: number | null
          pillow_covers_given?: number
          pillow_covers_taken?: number | null
          towels_given?: number
          towels_taken?: number | null
          blankets_given?: number
          blankets_taken?: number | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
      is_management_or_above: { Args: { _user_id: string }; Returns: boolean }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
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
