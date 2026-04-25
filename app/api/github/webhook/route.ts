/**
 * GitHub App Webhook handler.
 * Receives push events and triggers dependency scans.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/github/webhook'
import { getInstallationToken } from '@/lib/github/app'
import { runScan } from '@/lib/scanner/engine'
import { createScanIssue } from '@/lib/github/issues'
import { createAdminClient } from '@/lib/supabase/server'
import type { Repository } from '@/lib/supabase/types'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')
  const event = request.headers.get('x-github-event')

  const isValid = await verifyWebhookSignature(rawBody, signature)
  if (!isValid) {
    console.warn('[webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (event !== 'push') {
    return NextResponse.json({ ok: true, skipped: `event=${event}` })
  }

  let payload: {
    ref: string
    repository: { id: number; full_name: string; default_branch: string }
    installation?: { id: number }
  }

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ref, repository } = payload
  const defaultRef = `refs/heads/${repository.default_branch}`

  if (ref !== defaultRef) {
    return NextResponse.json({ ok: true, skipped: `ref=${ref}` })
  }

  const repoFullName = repository.full_name

  try {
    const supabase = await createAdminClient()

    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('id, full_name, user_id')
      .eq('full_name', repoFullName)
      .maybeSingle() as unknown as { data: Pick<Repository, 'id' | 'full_name' | 'user_id'> | null; error: Error | null }

    if (repoError) {
      console.error('[webhook] DB error:', repoError)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    if (!repo) {
      return NextResponse.json({ ok: true, skipped: 'repo not registered' })
    }

    const githubToken = await getInstallationToken()

    const result = await runScan({
      repositoryId: repo.id,
      repoFullName,
      githubToken,
    })

    let issueUrl: string | null = null
    if (result.vulnerabilitiesCount > 0 && result.status === 'completed') {
      const totalSerious = result.criticalCount + result.highCount
      if (totalSerious > 0) {
        issueUrl = await createScanIssue({
          scanId: result.scanId,
          repositoryId: repo.id,
          repoFullName,
          githubToken,
          minSeverity: 'high',
        })
      }
    }

    console.log(`[webhook] Scan complete: ${repoFullName} → ${result.vulnerabilitiesCount} vulns, issue: ${issueUrl ?? 'none'}`)

    return NextResponse.json({
      ok: true,
      scanId: result.scanId,
      vulnerabilitiesCount: result.vulnerabilitiesCount,
      issueUrl,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[webhook] Error: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
