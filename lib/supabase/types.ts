/**
 * Manual Database types for Supabase.
 * Replace with generated types once `supabase gen types` is configured.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      repositories: {
        Row: {
          id: string
          user_id: string
          full_name: string
          github_id: number | null
          language: string | null
          is_private: boolean
          last_scan_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          github_id?: number | null
          language?: string | null
          is_private?: boolean
          last_scan_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['repositories']['Insert']>
      }
      vulnerability_scans: {
        Row: {
          id: string
          repo_id: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          trigger: 'manual' | 'webhook' | 'scheduled'
          total_deps: number
          vulnerable_deps: number
          critical_count: number
          high_count: number
          medium_count: number
          low_count: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
        }
        Insert: {
          id?: string
          repo_id: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          trigger?: 'manual' | 'webhook' | 'scheduled'
          total_deps?: number
          vulnerable_deps?: number
          critical_count?: number
          high_count?: number
          medium_count?: number
          low_count?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
        }
        Update: Partial<Database['public']['Tables']['vulnerability_scans']['Insert']>
      }
      vulnerabilities: {
        Row: {
          id: string
          scan_id: string
          repo_id: string
          package_name: string
          package_version: string
          ecosystem: string
          severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown'
          cve_id: string | null
          osv_id: string | null
          title: string
          description: string | null
          fixed_version: string | null
          github_issue_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          repo_id: string
          package_name: string
          package_version: string
          ecosystem: string
          severity?: 'critical' | 'high' | 'medium' | 'low' | 'unknown'
          cve_id?: string | null
          osv_id?: string | null
          title: string
          description?: string | null
          fixed_version?: string | null
          github_issue_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['vulnerabilities']['Insert']>
      }
      github_issues: {
        Row: {
          id: string
          scan_id: string
          repo_id: string
          issue_number: number
          issue_url: string
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          repo_id: string
          issue_number: number
          issue_url: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['github_issues']['Insert']>
      }
    }
  }
}

// Convenience row types
export type Repository = Database['public']['Tables']['repositories']['Row']
export type RepositoryInsert = Database['public']['Tables']['repositories']['Insert']
export type VulnerabilityScan = Database['public']['Tables']['vulnerability_scans']['Row']
export type VulnerabilityScanInsert = Database['public']['Tables']['vulnerability_scans']['Insert']
export type Vulnerability = Database['public']['Tables']['vulnerabilities']['Row']
export type VulnerabilityInsert = Database['public']['Tables']['vulnerabilities']['Insert']
export type GithubIssue = Database['public']['Tables']['github_issues']['Row']
