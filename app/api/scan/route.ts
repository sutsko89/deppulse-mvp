import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runScan } from '@/lib/scanner/engine'
import { createScanIssue } from '@/lib/github/issues'
import { z } from 'zod'

const ScanRequestSchema = z.object({
  repositoryId: z.string().uuid(),
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  createIssue: z.boolean().optional().default(true),
  minSeverity: z.enum(['critical', 'high', 'medium', 'low']).optional().default('high'),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ScanRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 })
  }

  const { repositoryId, repoFullName, createIssue, minSeverity } = parsed.data

  // Verify user owns this repository
  const { data: repo } = await supabase
    .from('repositories')
    .select('id, full_name, user_id')
    .eq('id', repositoryId)
    .eq('user_id', user.id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
  }

  // Get GitHub token from Supabase session
  const { data: { session } } = await supabase.auth.getSession()
  const githubToken = session?.provider_token

  if (!githubToken) {
    return NextResponse.json(
      { error: 'GitHub token not available. Please re-authenticate.' },
      { status: 401 }
    )
  }

  try {
    // Run scan
    const result = await runScan({
      repositoryId,
      repoFullName,
      githubToken,
    })

    // Create GitHub Issue if requested and vulns found
    let issueUrl: string | null = null
    if (createIssue && result.vulnerabilitiesCount > 0 && result.status === 'completed') {
      issueUrl = await createScanIssue({
        scanId: result.scanId,
        repositoryId,
        repoFullName,
        githubToken,
        minSeverity,
      })
    }

    return NextResponse.json({
      success: true,
      scanId: result.scanId,
      dependenciesCount: result.dependenciesCount,
      vulnerabilitiesCount: result.vulnerabilitiesCount,
      criticalCount: result.criticalCount,
      highCount: result.highCount,
      mediumCount: result.mediumCount,
      lowCount: result.lowCount,
      status: result.status,
      issueUrl,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
