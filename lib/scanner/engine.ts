/**
 * Scan engine: fetch lockfile from GitHub → parse → query OSV → persist to Supabase.
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
import type { TablesInsert } from '@/lib/types/database'

const LOCKFILES = [
  'package-lock.json',
  'requirements.txt',
  'composer.lock',
  'go.sum',
]

export interface ScanOptions {
  repositoryId: string
  repoFullName: string    // e.g. "owner/repo"
  githubToken: string     // user's GitHub access token
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

  // Create scan record (pending)
  const { data: scan, error: scanError } = await supabase
    .from('vulnerability_scans')
    .insert({
      repository_id: options.repositoryId,
      status: 'pending',
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
        scanned_at: new Date().toISOString(),
      }).eq('id', scanId)

      return { scanId, dependenciesCount: 0, vulnerabilitiesCount: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, status: 'completed' }
    }

    // Deduplicate packages
    const uniquePackages = Array.from(
      new Map(allPackages.map(p => [`${p.ecosystem}:${p.name}@${p.version}`, p])).values()
    )

    // Query OSV for all packages
    const batchResult = await queryOsvBatch(uniquePackages)

    // Map results to vulnerabilities
    const vulnRows: TablesInsert<'vulnerabilities'>[] = []
    let criticalCount = 0, highCount = 0, mediumCount = 0, lowCount = 0

    for (let i = 0; i < uniquePackages.length; i++) {
      const pkg = uniquePackages[i]
      const vulns = batchResult.results[i]?.vulns ?? []

      for (const vuln of vulns) {
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
          version: pkg.version,
          ecosystem: pkg.ecosystem,
          severity,
          summary: vuln.summary ?? null,
          details: vuln.details ?? null,
          aliases: vuln.aliases ?? null,
          cvss_score: cvss,
          fix_available: !!safeVersion,
          safe_version: safeVersion,
          published: vuln.published ?? null,
          is_resolved: false,
        })
      }
    }

    // Persist vulnerabilities (upsert by scan_id + osv_id + package)
    if (vulnRows.length > 0) {
      const { error: vulnError } = await supabase
        .from('vulnerabilities')
        .insert(vulnRows)

      if (vulnError) {
        throw new Error(`Failed to persist vulnerabilities: ${vulnError.message}`)
      }
    }

    // Update scan record
    await supabase.from('vulnerability_scans').update({
      status: 'completed',
      dependencies_count: uniquePackages.length,
      vulnerabilities_count: vulnRows.length,
      critical_count: criticalCount,
      high_count: highCount,
      medium_count: mediumCount,
      low_count: lowCount,
      scanned_at: new Date().toISOString(),
    }).eq('id', scanId)

    // Update repository last_scan_at
    await supabase.from('repositories').update({
      last_scan_at: new Date().toISOString(),
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
    await supabase.from('vulnerability_scans').update({
      status: 'failed',
      scanned_at: new Date().toISOString(),
    }).eq('id', scanId)

    await supabase.from('error_logs').insert({
      level: 'error',
      message: `Scan failed: ${message}`,
      scan_id: scanId,
      context: { repoFullName: options.repoFullName },
    })

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
