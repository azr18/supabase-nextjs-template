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
      airline_types: {
        Row: {
          code: string
          country: string
          created_at: string
          currency: string
          display_name: string
          file_format_config: Json | null
          id: string
          is_active: boolean
          logo_url: string | null
          order_index: number
          processing_config: Json | null
          short_name: string
          support_email: string | null
          ui_config: Json | null
          updated_at: string
          validation_rules: Json | null
          website_url: string | null
        }
        Insert: {
          code: string
          country: string
          created_at?: string
          currency?: string
          display_name: string
          file_format_config?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          order_index?: number
          processing_config?: Json | null
          short_name: string
          support_email?: string | null
          ui_config?: Json | null
          updated_at?: string
          validation_rules?: Json | null
          website_url?: string | null
        }
        Update: {
          code?: string
          country?: string
          created_at?: string
          currency?: string
          display_name?: string
          file_format_config?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          order_index?: number
          processing_config?: Json | null
          short_name?: string
          support_email?: string | null
          ui_config?: Json | null
          updated_at?: string
          validation_rules?: Json | null
          website_url?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          industry: string | null
          last_name: string
          message: string
          phone_number: string | null
          source: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          industry?: string | null
          last_name: string
          message: string
          phone_number?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          industry?: string | null
          last_name?: string
          message?: string
          phone_number?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reconciliation_jobs: {
        Row: {
          actual_duration_minutes: number | null
          airline_type: string
          completed_at: string | null
          created_at: string
          description: string | null
          error_details: Json | null
          error_message: string | null
          estimated_duration_minutes: number | null
          failed_at: string | null
          id: string
          invoice_file_id: string | null
          invoice_file_path: string | null
          job_name: string
          processing_metadata: Json | null
          progress_percentage: number
          report_file_id: string | null
          report_file_path: string | null
          result_file_path: string | null
          result_summary: Json | null
          started_at: string | null
          status: string
          tool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          airline_type: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_duration_minutes?: number | null
          failed_at?: string | null
          id?: string
          invoice_file_id?: string | null
          invoice_file_path?: string | null
          job_name: string
          processing_metadata?: Json | null
          progress_percentage?: number
          report_file_id?: string | null
          report_file_path?: string | null
          result_file_path?: string | null
          result_summary?: Json | null
          started_at?: string | null
          status?: string
          tool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          airline_type?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          error_details?: Json | null
          error_message?: string | null
          estimated_duration_minutes?: number | null
          failed_at?: string | null
          id?: string
          invoice_file_id?: string | null
          invoice_file_path?: string | null
          job_name?: string
          processing_metadata?: Json | null
          progress_percentage?: number
          report_file_id?: string | null
          report_file_path?: string | null
          result_file_path?: string | null
          result_summary?: Json | null
          started_at?: string | null
          status?: string
          tool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_jobs_airline_type_fkey"
            columns: ["airline_type"]
            isOneToOne: false
            referencedRelation: "active_airline_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "reconciliation_jobs_airline_type_fkey"
            columns: ["airline_type"]
            isOneToOne: false
            referencedRelation: "airline_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "reconciliation_jobs_invoice_file_id_fkey"
            columns: ["invoice_file_id"]
            isOneToOne: false
            referencedRelation: "active_saved_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_jobs_invoice_file_id_fkey"
            columns: ["invoice_file_id"]
            isOneToOne: false
            referencedRelation: "saved_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_jobs_report_file_id_fkey"
            columns: ["report_file_id"]
            isOneToOne: false
            referencedRelation: "active_saved_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_jobs_report_file_id_fkey"
            columns: ["report_file_id"]
            isOneToOne: false
            referencedRelation: "saved_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_jobs_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_invoices: {
        Row: {
          airline_type: string
          created_at: string
          file_hash: string
          file_path: string
          file_size: number
          id: string
          is_active: boolean
          last_used_at: string | null
          metadata: Json | null
          mime_type: string
          original_filename: string
          updated_at: string
          upload_date: string
          usage_count: number
          user_id: string
        }
        Insert: {
          airline_type: string
          created_at?: string
          file_hash: string
          file_path: string
          file_size: number
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          mime_type?: string
          original_filename: string
          updated_at?: string
          upload_date?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          airline_type?: string
          created_at?: string
          file_hash?: string
          file_path?: string
          file_size?: number
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          mime_type?: string
          original_filename?: string
          updated_at?: string
          upload_date?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_invoices_airline_type_fkey"
            columns: ["airline_type"]
            isOneToOne: false
            referencedRelation: "active_airline_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "saved_invoices_airline_type_fkey"
            columns: ["airline_type"]
            isOneToOne: false
            referencedRelation: "airline_types"
            referencedColumns: ["code"]
          },
        ]
      }
      tools: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          order_index: number | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_index?: number | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_index?: number | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_tool_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          external_subscription_id: string | null
          id: string
          notes: string | null
          started_at: string
          status: string
          tool_id: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          external_subscription_id?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          tool_id: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          external_subscription_id?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          tool_id?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tool_subscriptions_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_airline_types: {
        Row: {
          code: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          display_name: string | null
          file_format_config: Json | null
          id: string | null
          logo_url: string | null
          order_index: number | null
          processing_config: Json | null
          short_name: string | null
          ui_config: Json | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          code?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          file_format_config?: Json | null
          id?: string | null
          logo_url?: string | null
          order_index?: number | null
          processing_config?: Json | null
          short_name?: string | null
          ui_config?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          code?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          file_format_config?: Json | null
          id?: string | null
          logo_url?: string | null
          order_index?: number | null
          processing_config?: Json | null
          short_name?: string | null
          ui_config?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      active_saved_invoices: {
        Row: {
          airline_type: string | null
          created_at: string | null
          file_hash: string | null
          file_path: string | null
          file_size: number | null
          file_size_mb: number | null
          id: string | null
          last_used_at: string | null
          metadata: Json | null
          mime_type: string | null
          original_filename: string | null
          updated_at: string | null
          upload_date: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          airline_type?: string | null
          created_at?: string | null
          file_hash?: string | null
          file_path?: string | null
          file_size?: number | null
          file_size_mb?: never
          id?: string | null
          last_used_at?: string | null
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          updated_at?: string | null
          upload_date?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          airline_type?: string | null
          created_at?: string | null
          file_hash?: string | null
          file_path?: string | null
          file_size?: number | null
          file_size_mb?: never
          id?: string | null
          last_used_at?: string | null
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          updated_at?: string | null
          upload_date?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_invoices_airline_type_fkey"
            columns: ["airline_type"]
            isOneToOne: false
            referencedRelation: "active_airline_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "saved_invoices_airline_type_fkey"
            columns: ["airline_type"]
            isOneToOne: false
            referencedRelation: "airline_types"
            referencedColumns: ["code"]
          },
        ]
      }
      active_user_subscriptions: {
        Row: {
          expires_at: string | null
          id: string | null
          order_index: number | null
          started_at: string | null
          status: string | null
          tool_description: string | null
          tool_icon: string | null
          tool_id: string | null
          tool_name: string | null
          tool_slug: string | null
          trial_ends_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tool_subscriptions_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_analytics: {
        Row: {
          count: number | null
          date: string | null
          status: string | null
        }
        Relationships: []
      }
      system_foreign_key_constraints: {
        Row: {
          column_name: unknown | null
          constraint_name: unknown | null
          delete_rule: string | null
          foreign_column_name: unknown | null
          foreign_table_name: unknown | null
          table_name: unknown | null
          update_rule: string | null
        }
        Relationships: []
      }
      user_reconciliation_jobs_summary: {
        Row: {
          actual_duration_minutes: number | null
          airline_type: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          error_message: string | null
          failed_at: string | null
          id: string | null
          job_name: string | null
          progress_percentage: number | null
          result_file_path: string | null
          started_at: string | null
          status: string | null
          tool_name: string | null
          tool_slug: string | null
          ui_status_type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_jobs_airline_type_fkey"
            columns: ["airline_type"]
            isOneToOne: false
            referencedRelation: "active_airline_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "reconciliation_jobs_airline_type_fkey"
            columns: ["airline_type"]
            isOneToOne: false
            referencedRelation: "airline_types"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      can_access_reconciliation_job: {
        Args: {
          job_row: Database["public"]["Tables"]["reconciliation_jobs"]["Row"]
        }
        Returns: boolean
      }
      can_create_job_for_tool: {
        Args: { target_tool_id: string }
        Returns: boolean
      }
      can_create_reconciliation_job: {
        Args: {
          target_user_id: string
          target_tool_id: string
          target_invoice_file_id?: string
          target_report_file_id?: string
        }
        Returns: boolean
      }
      check_duplicate_invoice: {
        Args: {
          p_user_id: string
          p_airline_type: string
          p_file_hash: string
          p_filename?: string
          p_file_size?: number
        }
        Returns: {
          duplicate_found: boolean
          existing_invoice_id: string
          existing_filename: string
          existing_upload_date: string
        }[]
      }
      check_storage_quota_before_insert: {
        Args: { p_file_size: number }
        Returns: {
          can_upload: boolean
          current_usage_mb: number
          quota_mb: number
          remaining_mb: number
          message: string
        }[]
      }
      check_storage_quota_before_upload: {
        Args: { bucket_name: string; file_size?: number }
        Returns: boolean
      }
      check_storage_quota_before_upload_detailed: {
        Args: { bucket_name: string; file_size?: number; user_uuid?: string }
        Returns: boolean
      }
      check_user_has_tool_access_for_storage: {
        Args: { bucket_name: string }
        Returns: boolean
      }
      check_user_owns_storage_object: {
        Args: { object_name: string }
        Returns: boolean
      }
      cleanup_expired_temp_files: {
        Args: { hours_old?: number; bucket_name?: string }
        Returns: number
      }
      cleanup_old_unused_invoices: {
        Args: { p_days_threshold?: number; p_max_cleanup?: number }
        Returns: {
          cleaned_count: number
          space_freed_mb: number
          message: string
        }[]
      }
      cleanup_orphaned_records: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          table_name: string
          records_affected: number
        }[]
      }
      create_reconciliation_job: {
        Args: {
          p_tool_id: string
          p_airline_type: string
          p_job_name: string
          p_description?: string
          p_invoice_file_id?: string
          p_report_file_id?: string
          p_invoice_file_path?: string
          p_report_file_path?: string
          p_estimated_duration?: number
          p_processing_metadata?: Json
        }
        Returns: {
          success: boolean
          job_id: string
          message: string
        }[]
      }
      get_airline_config: {
        Args: { airline_code: string }
        Returns: {
          id: string
          code: string
          display_name: string
          short_name: string
          country: string
          currency: string
          processing_config: Json
          file_format_config: Json
          validation_rules: Json
          ui_config: Json
        }[]
      }
      get_user_active_tools: {
        Args: Record<PropertyKey, never>
        Returns: {
          tool_id: string
          tool_name: string
          tool_slug: string
          tool_description: string
          tool_icon: string
          subscription_status: string
          expires_at: string
          trial_ends_at: string
        }[]
      }
      get_user_invoices_by_airline: {
        Args: { p_airline_type?: string }
        Returns: {
          id: string
          airline_type: string
          original_filename: string
          file_size: number
          file_size_mb: number
          upload_date: string
          last_used_at: string
          usage_count: number
          metadata: Json
        }[]
      }
      get_user_storage_by_bucket: {
        Args: { user_uuid?: string }
        Returns: {
          bucket_id: string
          file_count: number
          total_size_bytes: number
          total_size_mb: number
        }[]
      }
      get_user_storage_quota_info: {
        Args: { user_uuid?: string }
        Returns: {
          user_id: string
          current_usage_bytes: number
          current_usage_mb: number
          quota_limit_bytes: number
          quota_limit_mb: number
          available_bytes: number
          available_mb: number
          usage_percentage: number
          can_upload: boolean
        }[]
      }
      get_user_storage_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_files: number
          total_size_bytes: number
          total_size_mb: number
          quota_mb: number
          quota_remaining_mb: number
          quota_usage_percent: number
        }[]
      }
      get_user_storage_usage_bytes: {
        Args: { user_uuid?: string }
        Returns: number
      }
      insert_saved_invoice: {
        Args: {
          p_airline_type: string
          p_original_filename: string
          p_file_path: string
          p_file_hash: string
          p_file_size: number
          p_mime_type?: string
          p_metadata?: Json
        }
        Returns: {
          success: boolean
          invoice_id: string
          is_duplicate: boolean
          message: string
        }[]
      }
      soft_delete_invoice: {
        Args: { invoice_id: string }
        Returns: boolean
      }
      update_invoice_usage: {
        Args: { invoice_id: string }
        Returns: undefined
      }
      update_job_status: {
        Args: {
          job_id: string
          new_status: string
          progress_percent?: number
          error_msg?: string
          error_data?: Json
        }
        Returns: boolean
      }
      user_has_active_tool_subscription: {
        Args: { tool_slug: string }
        Returns: boolean
      }
      user_has_any_active_subscription: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_job_tool_access: {
        Args: { job_user_id: string; job_tool_id: string }
        Returns: boolean
      }
      validate_airline_invoice: {
        Args: { airline_code: string; invoice_data: Json }
        Returns: {
          is_valid: boolean
          validation_errors: string[]
          missing_fields: string[]
        }[]
      }
      validate_file_upload_quota: {
        Args: {
          bucket_name: string
          object_name: string
          file_size: number
          user_uuid?: string
        }
        Returns: {
          can_upload: boolean
          reason: string
          current_usage_mb: number
          available_mb: number
          file_size_mb: number
        }[]
      }
      validate_invoice_reconciler_file_path: {
        Args: { object_name: string }
        Returns: boolean
      }
      validate_referential_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          constraint_type: string
          issue_count: number
          description: string
        }[]
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

// Additional type helpers for common operations
export type Tool = Tables<'tools'>
export type UserToolSubscription = Tables<'user_tool_subscriptions'>
export type SavedInvoice = Tables<'saved_invoices'>
export type ReconciliationJob = Tables<'reconciliation_jobs'>
export type AirlineType = Tables<'airline_types'>

// Views
export type ActiveAirlineType = Tables<'active_airline_types'>
export type ActiveSavedInvoice = Tables<'active_saved_invoices'>
export type ActiveUserSubscription = Tables<'active_user_subscriptions'>
export type UserReconciliationJobSummary = Tables<'user_reconciliation_jobs_summary'>

// Insert types
export type ToolInsert = TablesInsert<'tools'>
export type UserToolSubscriptionInsert = TablesInsert<'user_tool_subscriptions'>
export type SavedInvoiceInsert = TablesInsert<'saved_invoices'>
export type ReconciliationJobInsert = TablesInsert<'reconciliation_jobs'>
export type AirlineTypeInsert = TablesInsert<'airline_types'>

// Update types
export type ToolUpdate = TablesUpdate<'tools'>
export type UserToolSubscriptionUpdate = TablesUpdate<'user_tool_subscriptions'>
export type SavedInvoiceUpdate = TablesUpdate<'saved_invoices'>
export type ReconciliationJobUpdate = TablesUpdate<'reconciliation_jobs'>
export type AirlineTypeUpdate = TablesUpdate<'airline_types'>

// Function argument and return types
export type DuplicateCheckResult = Database['public']['Functions']['check_duplicate_invoice']['Returns'][0]
export type StorageQuotaResult = Database['public']['Functions']['check_storage_quota_before_insert']['Returns'][0]
export type UserActiveToolsResult = Database['public']['Functions']['get_user_active_tools']['Returns'][0]
export type UserInvoicesByAirlineResult = Database['public']['Functions']['get_user_invoices_by_airline']['Returns'][0]
export type UserStorageUsageResult = Database['public']['Functions']['get_user_storage_usage']['Returns'][0]
export type CreateJobResult = Database['public']['Functions']['create_reconciliation_job']['Returns'][0]
export type InsertInvoiceResult = Database['public']['Functions']['insert_saved_invoice']['Returns'][0]
export type AirlineConfigResult = Database['public']['Functions']['get_airline_config']['Returns'][0] 