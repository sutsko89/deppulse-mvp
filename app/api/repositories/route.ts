import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const AddRepoSchema = z.object({
  fullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/, 'Формат: owner/repo'),
  githubRepoId: z.number().int().positive(),
  isPrivate: z.boolean().default(false),
  htmlUrl: z.string().url().optional(),
  defaultBranch: z.string().default('main'),
  installationId: z.number().int().positive().optional(),
})

// GET /api/repositories — list user's repos
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('repositories')
    .select('id, full_name, name, last_scan_at, last_scan_status, created_at, scan_enabled, notify_critical, notify_high')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ repositories: data })
}

// POST /api/repositories — add a repo
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

  const parsed = AddRepoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { fullName, githubRepoId, isPrivate, htmlUrl, defaultBranch, installationId } = parsed.data

  // Extract repo name from full_name (e.g. "owner/repo" → "repo")
  const name = fullName.split('/')[1]

  // Check duplicate
  const { data: existing } = await supabase
    .from('repositories')
    .select('id')
    .eq('full_name', fullName)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Репозиторий уже добавлен' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('repositories')
    .insert({
      full_name: fullName,
      name,
      github_repo_id: githubRepoId,
      user_id: user.id,
      is_private: isPrivate,
      html_url: htmlUrl,
      default_branch: defaultBranch,
      installation_id: installationId,
    })
    .select('id, full_name, name')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ repository: data }, { status: 201 })
}

// DELETE /api/repositories?id=<uuid> — remove a repo
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('repositories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
