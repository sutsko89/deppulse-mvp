export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          error_message: string | null
          error_type: string | null
          id: string
          level: string
          message: string
          scan_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          level: string
          message: string
          scan_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          level?: string
          message?: string
          scan_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      github_issue_notifications: {
        Row: {
          created_at: string
          error_message: string | null
          github_issue_number: number | null
          github_issue_title: string | null
          github_issue_url: string | null
          id: string
          is_open: boolean | null
          repo_id: string
          scan_id: string
          severity_filter: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          github_issue_number?: number | null
          github_issue_title?: string | null
          github_issue_url?: string | null
          id?: string
          is_open?: boolean | null
          repo_id: string
          scan_id: string
          severity_filter?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          github_issue_number?: number | null
          github_issue_title?: string | null
          github_issue_url?: string | null
          id?: string
          is_open?: boolean | null
          repo_id?: string
          scan_id?: string
          severity_filter?: string
          status?: string
          updated_at?: string
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
          avatar_url: string | null
          created_at: string
          email: string | null
          github_id: number
          id: string
          name: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          github_id: number
          id?: string
          name?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          github_id?: number
          id?: string
          name?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      repositories: {
        Row: {
          created_at: string
          default_branch: string | null
          description: string | null
          full_name: string
          github_repo_id: number
          html_url: string | null
          id: string
          is_private: boolean
          language: string | null
          last_scan_at: string | null
          last_scan_status: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_branch?: string | null
          description?: string | null
          full_name: string
          github_repo_id: number
          html_url?: string | null
          id?: string
          is_private?: boolean
          language?: string | null
          last_scan_at?: string | null
          last_scan_status?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_branch?: string | null
          description?: string | null
          full_name?: string
          github_repo_id?: number
          html_url?: string | null
          id?: string
          is_private?: boolean
          language?: string | null
          last_scan_at?: string | null
          last_scan_status?: string | null
          name?: string
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
          aliases: string[] | null
          created_at: string
          cve_ids: string[] | null
          cvss_score: number | null
          details: string | null
          ecosystem: string | null
          /** @deprecated use fixed_version */
          fix_available: boolean
          fixed_version: string | null
          github_issue_url: string | null
          id: string
          is_resolved: boolean
          osv_id: string
          osv_url: string | null
          package_name: string
          package_version: string | null
          published: string | null
          repo_id: string | null
          resolved_at: string | null
          /** @deprecated use fixed_version */
          safe_version: string | null
          scan_id: string
          severity: Database["public"]["Enums"]["severity"]
          summary: string | null
          updated_at: string
          /** @deprecated use package_version */
          version: string | null
        }
        Insert: {
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
          /** @deprecated use total_deps */
          dependencies_count: number | null
          error_message: string | null
          high_count: number
          id: string
          low_count: number
          medium_count: number
          repo_id: string | null
          /** @deprecated use repo_id */
          repository_id: string
          /** @deprecated use completed_at */
          scanned_at: string | null
          started_at: string | null
          status: string | null
          total_deps: number | null
          triggered_by: string | null
          /** @deprecated use vulnerable_deps */
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
          triggered_by?: string | null
          vulnerabilities_count?: number | null
          vulnerable_deps?: number | null
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
          triggered_by?: string | null
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
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      cleanup_old_error_logs: { Args: never; Returns: undefined }
    }
    Enums: {
      severity: "critical" | "high" | "medium" | "low" | "info"
      severity_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"
      subscription_tier: "free" | "pro" | "enterprise"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      severity: ["critical", "high", "medium", "low", "info"] as const,
      severity_level: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const,
      subscription_tier: ["free", "pro", "enterprise"] as const,
    },
  },
} as const

// ─── Convenience type aliases ─────────────────────────────────────────────────

export type Profile = Tables<'profiles'>
export type Repository = Tables<'repositories'>
export type VulnerabilityScan = Tables<'vulnerability_scans'>
export type Vulnerability = Tables<'vulnerabilities'>
export type GithubIssueNotification = Tables<'github_issue_notifications'>
export type UserNotification = Tables<'user_notifications'>
export type ErrorLog = Tables<'error_logs'>
export type AiAnalysisCache = Tables<'ai_analysis_cache'>

export type SeverityLevel = Database['public']['Enums']['severity']
export type SubscriptionTier = Database['public']['Enums']['subscription_tier']
