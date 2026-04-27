/**
 * Scan engine: fetch lockfile from GitHub → parse → query OSV → persist to Supabase.
 * Schema: aligned with 002_alter_schema_to_v2 migration.
 */

import { Octokit } from '@octokit/rest'
import { parseByFilename } from '@/lib/parsers'
import {
  queryOsvBatch,
  extractCvssScore,
  extractSafeVersion,
  cvssToSeverity,
  type OsvVulnerability,
} from '@/lib/osv/client'
import { createAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type VulnInsert = Database['public']['Tables']['vulnerabilities']['Insert']

const LOCKFILES = [
  'package-lock.json',
  'yarn.lock',
  'requirements.txt',
  'Pipfile.lock',
  'composer.lock',
  'go.sum',
  'Cargo.lock',
]

export interface ScanOptions {
  repositoryId: string
  repoFullName: string    // e.g. "owner/repo"
  githubToken: string     // user's GitHub access token or installation token
  commitSha?: string      // optional commit SHA for tracking
  triggeredBy?: string    // 'manual' | 'webhook' | 'schedule'
}

export interface ScanSummary {
  scanId: string
  dependenciesCount: number
  vulnerabilitiesCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  status: 'completed' | 'failed'
}

/**
 * Main scan entry point.
 */
export async function runScan(options: ScanOptions): Promise<ScanSummary> {
  const supabase = await createAdminClient()
  const [owner, repo] = options.repoFullName.split('/')

  // Create scan record (pending) — uses new v2 column names
  const { data: scan, error: scanError } = await supabase
    .from('vulnerability_scans')
    .insert({
      repository_id: options.repositoryId,  // legacy column (kept for backward compat)
      repo_id: options.repositoryId,         // new v2 column
      status: 'pending',
      triggered_by: options.triggeredBy ?? 'manual',
      commit_sha: options.commitSha ?? null,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (scanError || !scan) {
    throw new Error(`Failed to create scan: ${scanError?.message}`)
  }

  const scanId = scan.id

  try {
    const octokit = new Octokit({ auth: options.githubToken })

    // Fetch lockfiles from GitHub
    const allPackages: Array<{ name: string; version: string; ecosystem: string }> = []
    let foundLockfile = ''

    for (const lockfile of LOCKFILES) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: lockfile,
        })

        if ('content' in data && data.encoding === 'base64') {
          const content = Buffer.from(data.content, 'base64').toString('utf-8')
          const parsed = parseByFilename(lockfile, content)
          allPackages.push(...parsed.packages)
          foundLockfile = lockfile
          break // Use first found lockfile
        }
      } catch {
        // File not found, try next
        continue
      }
    }

    if (allPackages.length === 0) {
      await supabase.from('vulnerability_scans').update({
        status: 'completed',
        vulnerabilities_count: 0,
        dependencies_count: 0,
        total_deps: 0,
        vulnerable_deps: 0,
        completed_at: new Date().toISOString(),
        scanned_at: new Date().toISOString(),
      }).eq('id', scanId)

      return {
        scanId,
        dependenciesCount: 0,
        vulnerabilitiesCount: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        status: 'completed',
      }
    }

    // Deduplicate packages
    const uniquePackages = Array.from(
      new Map(allPackages.map(p => [`${p.ecosystem}:${p.name}@${p.version}`, p])).values()
    )

    // Query OSV for all packages
    const batchResult = await queryOsvBatch(uniquePackages)

    // Build typed vulnerability rows
    const vulnRows: VulnInsert[] = []
    let criticalCount = 0, highCount = 0, mediumCount = 0, lowCount = 0

    for (let i = 0; i < uniquePackages.length; i++) {
      const pkg = uniquePackages[i]
      const vulns = batchResult.results[i]?.vulns ?? []

      for (const vuln of vulns as OsvVulnerability[]) {
        const cvss = extractCvssScore(vuln)
        const severity = cvssToSeverity(cvss)
        const safeVersion = extractSafeVersion(vuln, pkg.name, pkg.ecosystem)

        if (severity === 'critical') criticalCount++
        else if (severity === 'high') highCount++
        else if (severity === 'medium') mediumCount++
        else if (severity === 'low') lowCount++

        vulnRows.push({
          scan_id: scanId,
          repo_id: options.repositoryId,
          osv_id: vuln.id,
          package_name: pkg.name,
          package_version: pkg.version,
          version: pkg.version,
          ecosystem: pkg.ecosystem,
          severity,
          summary: vuln.summary ?? null,
          details: vuln.details ?? null,
          aliases: vuln.aliases ?? null,
          cvss_score: cvss,
          fixed_version: safeVersion,
          fix_available: !!safeVersion,
          safe_version: safeVersion,
          published: vuln.published ?? null,
          is_resolved: false,
          osv_url: `https://osv.dev/vulnerability/${vuln.id}`,
          cve_ids: (vuln.aliases ?? []).filter((a: string) => a.startsWith('CVE-')),
        })
      }
    }

    // Persist vulnerabilities
    if (vulnRows.length > 0) {
      const { error: vulnError } = await supabase
        .from('vulnerabilities')
        .insert(vulnRows)

      if (vulnError) {
        throw new Error(`Failed to persist vulnerabilities: ${vulnError.message}`)
      }
    }

    const completedAt = new Date().toISOString()

    // Update scan record — both legacy and v2 columns
    await supabase.from('vulnerability_scans').update({
      status: 'completed',
      dependencies_count: uniquePackages.length,
      vulnerabilities_count: vulnRows.length,
      scanned_at: completedAt,
      total_deps: uniquePackages.length,
      vulnerable_deps: vulnRows.length,
      completed_at: completedAt,
      critical_count: criticalCount,
      high_count: highCount,
      medium_count: mediumCount,
      low_count: lowCount,
    }).eq('id', scanId)

    // Update repository last_scan_at + last_scan_status
    await supabase.from('repositories').update({
      last_scan_at: completedAt,
      last_scan_status: 'completed',
    }).eq('id', options.repositoryId)

    console.log(`[scan] ${options.repoFullName}: ${uniquePackages.length} deps, ${vulnRows.length} vulns (${foundLockfile})`)

    return {
      scanId,
      dependenciesCount: uniquePackages.length,
      vulnerabilitiesCount: vulnRows.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      status: 'completed',
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const completedAt = new Date().toISOString()

    await supabase.from('vulnerability_scans').update({
      status: 'failed',
      completed_at: completedAt,
      scanned_at: completedAt,
      error_message: message,
    }).eq('id', scanId)

    await supabase.from('error_logs').insert({
      level: 'error',
      message: `Scan failed: ${message}`,
      scan_id: scanId,
      error_type: 'scan_error',
      error_message: message,
      context: { repoFullName: options.repoFullName },
    })

    await supabase.from('repositories').update({
      last_scan_status: 'failed',
    }).eq('id', options.repositoryId)

    return {
      scanId,
      dependenciesCount: 0,
      vulnerabilitiesCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      status: 'failed',
    }
  }
}
