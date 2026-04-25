/**
 * OSV.dev API client
 * Docs: https://google.github.io/osv.dev/api/
 * Free, no rate limits for reasonable usage.
 */

const OSV_API = 'https://api.osv.dev/v1'

export interface OsvPackage {
  name: string
  version: string
  ecosystem: string
}

export interface OsvVulnerability {
  id: string
  summary?: string
  details?: string
  aliases?: string[]
  published?: string
  severity?: Array<{
    type: string
    score: string
  }>
  affected?: Array<{
    package: {
      ecosystem: string
      name: string
    }
    ranges?: Array<{
      type: string
      events: Array<{ introduced?: string; fixed?: string; last_affected?: string }>
    }>
    versions?: string[]
  }>
}

export interface OsvQueryResult {
  vulns?: OsvVulnerability[]
}

export interface OsvBatchResult {
  results: OsvQueryResult[]
}

/**
 * Query single package for vulnerabilities.
 */
export async function queryOsvPackage(pkg: OsvPackage): Promise<OsvVulnerability[]> {
  const res = await fetch(`${OSV_API}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      package: { name: pkg.name, ecosystem: pkg.ecosystem },
      version: pkg.version,
    }),
    next: { revalidate: 3600 }, // Cache for 1 hour
  })

  if (!res.ok) {
    throw new Error(`OSV API error: ${res.status} ${res.statusText}`)
  }

  const data: OsvQueryResult = await res.json()
  return data.vulns ?? []
}

/**
 * Batch query — up to 1000 packages per request.
 */
export async function queryOsvBatch(packages: OsvPackage[]): Promise<OsvBatchResult> {
  const BATCH_SIZE = 100 // Keep batches reasonable

  if (packages.length === 0) {
    return { results: [] }
  }

  const allResults: OsvQueryResult[] = []

  for (let i = 0; i < packages.length; i += BATCH_SIZE) {
    const batch = packages.slice(i, i + BATCH_SIZE)

    const res = await fetch(`${OSV_API}/querybatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: batch.map(pkg => ({
          package: { name: pkg.name, ecosystem: pkg.ecosystem },
          version: pkg.version,
        })),
      }),
    })

    if (!res.ok) {
      throw new Error(`OSV batch API error: ${res.status} ${res.statusText}`)
    }

    const data: OsvBatchResult = await res.json()
    allResults.push(...data.results)
  }

  return { results: allResults }
}

/**
 * Get full vulnerability details by OSV ID.
 */
export async function getOsvById(osvId: string): Promise<OsvVulnerability> {
  const res = await fetch(`${OSV_API}/vulns/${osvId}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`OSV vuln fetch error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

/**
 * Extract CVSS score from OSV vulnerability.
 */
export function extractCvssScore(vuln: OsvVulnerability): number | null {
  const severity = vuln.severity?.find(s => s.type === 'CVSS_V3' || s.type === 'CVSS_V2')
  if (!severity) return null

  // Extract base score from CVSS vector or numeric string
  const match = severity.score.match(/(\d+\.\d+)$/)
  return match ? parseFloat(match[1]) : null
}

/**
 * Extract safe/fixed version from OSV vulnerability.
 */
export function extractSafeVersion(
  vuln: OsvVulnerability,
  packageName: string,
  ecosystem: string
): string | null {
  const affected = vuln.affected?.find(
    a => a.package.name === packageName && a.package.ecosystem === ecosystem
  )
  if (!affected) return null

  for (const range of affected.ranges ?? []) {
    for (const event of range.events) {
      if (event.fixed) return event.fixed
    }
  }

  return null
}

/**
 * Map CVSS score to severity enum.
 */
export function cvssToSeverity(score: number | null): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  if (score === null) return 'info'
  if (score >= 9.0) return 'critical'
  if (score >= 7.0) return 'high'
  if (score >= 4.0) return 'medium'
  if (score > 0) return 'low'
  return 'info'
}
