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
      ai_analysis_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          response_data: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          response_data: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          response_data?: Json
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          endpoint: string | null
          error_message: string | null
          error_stack: string | null
          error_type: string | null
          id: string
          level: string
          message: string
          repo_id: string | null
          scan_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          error_stack?: string | null
          error_type?: string | null
          id?: string
          level: string
          message: string
          repo_id?: string | null
          scan_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          error_stack?: string | null
          error_type?: string | null
          id?: string
          level?: string
          message?: string
          repo_id?: string | null
          scan_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      github_issue_notifications: {
        Row: {
          closed_at: string | null
          created_at: string
          error_message: string | null
          github_issue_number: number | null
          github_issue_title: string | null
          github_issue_url: string | null
          id: string
          is_open: boolean
          repo_id: string
          scan_id: string
          severity_filter: string
          severity_summary: Json | null
          status: string
          updated_at: string
          vulnerability_ids: string[]
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          error_message?: string | null
          github_issue_number?: number | null
          github_issue_title?: string | null
          github_issue_url?: string | null
          id?: string
          is_open?: boolean
          repo_id: string
          scan_id: string
          severity_filter?: string
          severity_summary?: Json | null
          status?: string
          updated_at?: string
          vulnerability_ids?: string[]
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          error_message?: string | null
          github_issue_number?: number | null
          github_issue_title?: string | null
          github_issue_url?: string | null
          id?: string
          is_open?: boolean
          repo_id?: string
          scan_id?: string
          severity_filter?: string
          severity_summary?: Json | null
          status?: string
          updated_at?: string
          vulnerability_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "github_issue_notifications_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_issue_notifications_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "vulnerability_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_requests_reset_at: string | null
          ai_requests_used: number
          avatar_url: string | null
          created_at: string
          email: string | null
          github_id: number
          github_username: string | null
          id: string
          name: string | null
          subscription_ends_at: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          yukassa_customer_id: string | null
        }
        Insert: {
          ai_requests_reset_at?: string | null
          ai_requests_used?: number
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          github_id: number
          github_username?: string | null
          id?: string
          name?: string | null
          subscription_ends_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          yukassa_customer_id?: string | null
        }
        Update: {
          ai_requests_reset_at?: string | null
          ai_requests_used?: number
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          github_id?: number
          github_username?: string | null
          id?: string
          name?: string | null
          subscription_ends_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          yukassa_customer_id?: string | null
        }
        Relationships: []
      }
      repositories: {
        Row: {
          created_at: string
          default_branch: string
          full_name: string
          github_repo_id: number
          html_url: string | null
          id: string
          installation_id: number | null
          is_private: boolean
          last_scan_at: string | null
          last_scan_status: string | null
          name: string
          notify_critical: boolean
          notify_high: boolean
          notify_low: boolean
          notify_medium: boolean
          scan_enabled: boolean
          scan_frequency: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_branch?: string
          full_name: string
          github_repo_id: number
          html_url?: string | null
          id?: string
          installation_id?: number | null
          is_private?: boolean
          last_scan_at?: string | null
          last_scan_status?: string | null
          name: string
          notify_critical?: boolean
          notify_high?: boolean
          notify_low?: boolean
          notify_medium?: boolean
          scan_enabled?: boolean
          scan_frequency?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_branch?: string
          full_name?: string
          github_repo_id?: number
          html_url?: string | null
          id?: string
          installation_id?: number | null
          is_private?: boolean
          last_scan_at?: string | null
          last_scan_status?: string | null
          name?: string
          notify_critical?: boolean
          notify_high?: boolean
          notify_low?: boolean
          notify_medium?: boolean
          scan_enabled?: boolean
          scan_frequency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repositories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          github_issues_enabled: boolean
          id: string
          notify_critical: boolean | null
          notify_high: boolean | null
          notify_medium: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          github_issues_enabled?: boolean
          id?: string
          notify_critical?: boolean | null
          notify_high?: boolean | null
          notify_medium?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          github_issues_enabled?: boolean
          id?: string
          notify_critical?: boolean | null
          notify_high?: boolean | null
          notify_medium?: boolean
          user_id?: string
        }
        Relationships: []
      }
      vulnerabilities: {
        Row: {
          affected_versions: string[] | null
          ai_breaking_changes: string | null
          ai_confidence: number | null
          ai_risk_explanation: string | null
          ai_safe_update_path: string | null
          aliases: string[] | null
          created_at: string
          cve_ids: string[] | null
          cvss_score: number | null
          details: string | null
          ecosystem: string | null
          fix_available: boolean
          fixed_version: string | null
          github_issue_url: string | null
          id: string
          ignored_at: string | null
          is_ignored: boolean
          is_resolved: boolean
          osv_id: string
          osv_url: string | null
          package_name: string
          package_version: string | null
          published: string | null
          repo_id: string | null
          resolved_at: string | null
          safe_version: string | null
          scan_id: string
          severity: Database["public"]["Enums"]["severity"]
          summary: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          affected_versions?: string[] | null
          ai_breaking_changes?: string | null
          ai_confidence?: number | null
          ai_risk_explanation?: string | null
          ai_safe_update_path?: string | null
          aliases?: string[] | null
          created_at?: string
          cve_ids?: string[] | null
          cvss_score?: number | null
          details?: string | null
          ecosystem?: string | null
          fix_available?: boolean
          fixed_version?: string | null
          github_issue_url?: string | null
          id?: string
          ignored_at?: string | null
          is_ignored?: boolean
          is_resolved?: boolean
          osv_id: string
          osv_url?: string | null
          package_name: string
          package_version?: string | null
          published?: string | null
          repo_id?: string | null
          resolved_at?: string | null
          safe_version?: string | null
          scan_id: string
          severity: Database["public"]["Enums"]["severity"]
          summary?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          affected_versions?: string[] | null
          ai_breaking_changes?: string | null
          ai_confidence?: number | null
          ai_risk_explanation?: string | null
          ai_safe_update_path?: string | null
          aliases?: string[] | null
          created_at?: string
          cve_ids?: string[] | null
          cvss_score?: number | null
          details?: string | null
          ecosystem?: string | null
          fix_available?: boolean
          fixed_version?: string | null
          github_issue_url?: string | null
          id?: string
          ignored_at?: string | null
          is_ignored?: boolean
          is_resolved?: boolean
          osv_id?: string
          osv_url?: string | null
          package_name?: string
          package_version?: string | null
          published?: string | null
          repo_id?: string | null
          resolved_at?: string | null
          safe_version?: string | null
          scan_id?: string
          severity?: Database["public"]["Enums"]["severity"]
          summary?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_vulnerabilities_scan"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "vulnerability_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vulnerabilities_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      vulnerability_scans: {
        Row: {
          ai_summary: string | null
          commit_sha: string | null
          completed_at: string | null
          created_at: string | null
          critical_count: number
          dependencies_count: number | null
          error_message: string | null
          high_count: number
          id: string
          low_count: number
          medium_count: number
          repo_id: string | null
          repository_id: string
          scanned_at: string | null
          started_at: string | null
          status: string | null
          total_deps: number | null
          triggered_by: string
          vulnerabilities_count: number | null
          vulnerable_deps: number | null
        }
        Insert: {
          ai_summary?: string | null
          commit_sha?: string | null
          completed_at?: string | null
          created_at?: string | null
          critical_count?: number
          dependencies_count?: number | null
          error_message?: string | null
          high_count?: number
          id?: string
          low_count?: number
          medium_count?: number
          repo_id?: string | null
          repository_id: string
          scanned_at?: string | null
          started_at?: string | null
          status?: string | null
          total_deps?: number | null
          triggered_by?: string
          vulnerabilities_count?: number | null
          vulnerable_deps?: number | null
          name?: never
        }
        Update: {
          ai_summary?: string | null
          commit_sha?: string | null
          completed_at?: string | null
          created_at?: string | null
          critical_count?: number
          dependencies_count?: number | null
          error_message?: string | null
          high_count?: number
          id?: string
          low_count?: number
          medium_count?: number
          repo_id?: string | null
          repository_id?: string
          scanned_at?: string | null
          started_at?: string | null
          status?: string | null
          total_deps?: number | null
          triggered_by?: string
          vulnerabilities_count?: number | null
          vulnerable_deps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_scans_repository"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vulnerability_scans_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_error_logs: { Args: never; Returns: undefined }
      get_subscription_limits: {
        Args: { tier: Database["public"]["Enums"]["subscription_tier"] }
        Returns: Json
      }
    }
    Enums: {
      severity: "critical" | "high" | "medium" | "low" | "info"
      severity_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"
      subscription_tier: "free" | "pro" | "enterprise"
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
      severity: ["critical", "high", "medium", "low", "info"],
      severity_level: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
      subscription_tier: ["free", "pro", "enterprise"],
    },
  },
} as const
