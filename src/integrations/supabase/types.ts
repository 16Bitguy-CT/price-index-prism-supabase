export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      channel_segments: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          id: string
          is_active: boolean
          market_id: string
          organization_id: string
          segment_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean
          market_id: string
          organization_id: string
          segment_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean
          market_id?: string
          organization_id?: string
          segment_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_segments_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_channel_segments_market_id"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_channel_segments_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          channel_type: string
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          is_active: boolean
          market_id: string
          organization_id: string
          price_index_multiplier: number | null
          segment_id: string
          updated_at: string
        }
        Insert: {
          channel_type: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          market_id: string
          organization_id: string
          price_index_multiplier?: number | null
          segment_id: string
          updated_at?: string
        }
        Update: {
          channel_type?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          market_id?: string
          organization_id?: string
          price_index_multiplier?: number | null
          segment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "channel_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_channels_market_id"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_channels_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_channels_segment_id"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "channel_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          country: string
          created_at: string
          created_by_user_id: string | null
          currency: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          created_by_user_id?: string | null
          currency: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          created_by_user_id?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_markets_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_context_log: {
        Row: {
          id: string
          ip_address: unknown | null
          session_id: string | null
          switched_at: string
          switched_from_org_id: string
          switched_to_org_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          switched_at?: string
          switched_from_org_id: string
          switched_to_org_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          switched_at?: string
          switched_from_org_id?: string
          switched_to_org_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization_context_log_switched_from_org_id"
            columns: ["switched_from_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organization_context_log_switched_to_org_id"
            columns: ["switched_to_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          allowed_email_domains: Json | null
          brand_name: string | null
          created_at: string
          created_by_user_id: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          primary_color: string | null
          primary_domain: string | null
          requires_approval: boolean | null
          secondary_color: string | null
          slug: string
          third_party_domain: string | null
          updated_at: string
        }
        Insert: {
          allowed_email_domains?: Json | null
          brand_name?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string | null
          primary_domain?: string | null
          requires_approval?: boolean | null
          secondary_color?: string | null
          slug: string
          third_party_domain?: string | null
          updated_at?: string
        }
        Update: {
          allowed_email_domains?: Json | null
          brand_name?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          primary_domain?: string | null
          requires_approval?: boolean | null
          secondary_color?: string | null
          slug?: string
          third_party_domain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      outlets: {
        Row: {
          address: string | null
          channel_id: string
          contact_person: string | null
          created_at: string
          created_by_user_id: string | null
          email: string | null
          id: string
          is_active: boolean
          organization_id: string
          outlet_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          channel_id: string
          contact_person?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          outlet_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          channel_id?: string
          contact_person?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          outlet_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_outlets_channel_id"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_outlets_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outlets_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outlets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      price_capture_log: {
        Row: {
          captured_at: string
          captured_price: number
          captured_volume_ml: number | null
          channel_id: string
          created_at: string
          created_by_user_id: string | null
          id: string
          is_anchor: boolean
          market_id: string
          organization_id: string
          outlet_id: string
          sku_id: string
          updated_at: string
        }
        Insert: {
          captured_at?: string
          captured_price: number
          captured_volume_ml?: number | null
          channel_id: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_anchor?: boolean
          market_id: string
          organization_id: string
          outlet_id: string
          sku_id: string
          updated_at?: string
        }
        Update: {
          captured_at?: string
          captured_price?: number
          captured_volume_ml?: number | null
          channel_id?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          is_anchor?: boolean
          market_id?: string
          organization_id?: string
          outlet_id?: string
          sku_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_price_capture_log_channel_id"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_price_capture_log_market_id"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_price_capture_log_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_price_capture_log_outlet_id"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_price_capture_log_sku_id"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_capture_log_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_capture_log_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_capture_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_capture_log_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_capture_log_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_price_anchor: {
        Row: {
          anchor_brand: string
          anchor_pack_format: string | null
          anchor_product_name: string
          anchor_sku_id: string
          anchor_volume_ml: number | null
          channel_segment: string
          created_at: string
          created_by_user_id: string | null
          id: string
          market_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          anchor_brand: string
          anchor_pack_format?: string | null
          anchor_product_name: string
          anchor_sku_id: string
          anchor_volume_ml?: number | null
          channel_segment: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          market_id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          anchor_brand?: string
          anchor_pack_format?: string | null
          anchor_product_name?: string
          anchor_sku_id?: string
          anchor_volume_ml?: number | null
          channel_segment?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          market_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sku_price_anchor_anchor_sku_id"
            columns: ["anchor_sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sku_price_anchor_market_id"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sku_price_anchor_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sku_price_anchor_anchor_sku_id_fkey"
            columns: ["anchor_sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sku_price_anchor_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sku_price_anchor_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      skus: {
        Row: {
          anchor_sku_id: string | null
          barcode: string | null
          brand_name: string
          category: string | null
          channel_segment: string | null
          created_at: string
          created_by_user_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          market_id: string
          max_price_index: number | null
          min_price_index: number | null
          organization_id: string
          pack_format: string | null
          product_name: string
          shelf_position: string | null
          target_price_index: number | null
          target_shelf_share: number | null
          updated_at: string
          volume_ml: number | null
        }
        Insert: {
          anchor_sku_id?: string | null
          barcode?: string | null
          brand_name: string
          category?: string | null
          channel_segment?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          market_id: string
          max_price_index?: number | null
          min_price_index?: number | null
          organization_id: string
          pack_format?: string | null
          product_name: string
          shelf_position?: string | null
          target_price_index?: number | null
          target_shelf_share?: number | null
          updated_at?: string
          volume_ml?: number | null
        }
        Update: {
          anchor_sku_id?: string | null
          barcode?: string | null
          brand_name?: string
          category?: string | null
          channel_segment?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          market_id?: string
          max_price_index?: number | null
          min_price_index?: number | null
          organization_id?: string
          pack_format?: string | null
          product_name?: string
          shelf_position?: string | null
          target_price_index?: number | null
          target_shelf_share?: number | null
          updated_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_skus_anchor_sku_id"
            columns: ["anchor_sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_skus_market_id"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_skus_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skus_anchor_sku_id_fkey"
            columns: ["anchor_sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skus_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skus_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by_user_id: string | null
          created_at: string
          created_by_user_id: string | null
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          market_id: string | null
          organization_id: string
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          market_id?: string | null
          organization_id: string
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          market_id?: string | null
          organization_id?: string
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_approved_by_user_id"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_profiles_market_id"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_profiles_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_context_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_role: Database["public"]["Enums"]["user_role"]
          home_org_id: string
          current_org_id: string
          market_id: string
          is_active: boolean
          is_context_switched: boolean
        }[]
      }
      get_current_user_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_role: Database["public"]["Enums"]["user_role"]
          org_id: string
          market_id: string
          is_active: boolean
        }[]
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          approval_status: string | null
          approved_at: string | null
          approved_by_user_id: string | null
          created_at: string
          created_by_user_id: string | null
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          market_id: string | null
          organization_id: string
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
      }
      get_organization_by_email_domain: {
        Args: { email_address: string }
        Returns: string
      }
      is_email_domain_allowed: {
        Args: { email_address: string; org_id: string }
        Returns: boolean
      }
      reset_organization_context: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      switch_organization_context: {
        Args: { target_org_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "representative" | "market_admin" | "power_user" | "super_user"
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
    Enums: {
      user_role: ["representative", "market_admin", "power_user", "super_user"],
    },
  },
} as const
