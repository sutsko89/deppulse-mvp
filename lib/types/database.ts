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
          id: string
          level: string
          message: string
          scan_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level: string
          message: string
          scan_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
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
          github_issue_url: string | null
          id: string
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
          github_issue_url?: string | null
          id?: string
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
          github_issue_url?: string | null
          id?: string
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
          full_name: string
          github_repo_id: number
          html_url: string | null
          id: string
          is_private: boolean
          last_scan_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          github_repo_id: number
          html_url?: string | null
          id?: string
          is_private?: boolean
          last_scan_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          github_repo_id?: number
          html_url?: string | null
          id?: string
          is_private?: boolean
          last_scan_at?: string | null
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
          cvss_score: number | null
          details: string | null
          ecosystem: string | null
          fix_available: boolean
          github_issue_url: string | null
          id: string
          is_resolved: boolean
          osv_id: string
          package_name: string
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
          aliases?: string[] | null
          created_at?: string
          cvss_score?: number | null
          details?: string | null
          ecosystem?: string | null
          fix_available?: boolean
          github_issue_url?: string | null
          id?: string
          is_resolved?: boolean
          osv_id: string
          package_name: string
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
          cvss_score?: number | null
          details?: string | null
          ecosystem?: string | null
          fix_available?: boolean
          github_issue_url?: string | null
          id?: string
          is_resolved?: boolean
          osv_id?: string
          package_name?: string
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
          created_at: string | null
          critical_count: number
          dependencies_count: number | null
          high_count: number
          id: string
          low_count: number
          medium_count: number
          repository_id: string
          scanned_at: string | null
          status: string | null
          vulnerabilities_count: number | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string | null
          critical_count?: number
          dependencies_count?: number | null
          high_count?: number
          id?: string
          low_count?: number
          medium_count?: number
          repository_id: string
          scanned_at?: string | null
          status?: string | null
          vulnerabilities_count?: number | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string | null
          critical_count?: number
          dependencies_count?: number | null
          high_count?: number
          id?: string
          low_count?: number
          medium_count?: number
          repository_id?: string
          scanned_at?: string | null
          status?: string | null
          vulnerabilities_count?: number | null
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
