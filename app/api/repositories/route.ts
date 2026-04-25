import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Octokit } from '@octokit/rest'
import { z } from 'zod'

const AddRepoSchema = z.object({
  githubRepoId: z.number(),
  name: z.string(),
  fullName: z.string(),
  htmlUrl: z.string().url(),
  isPrivate: z.boolean(),
})

// GET /api/repositories — list user repos
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error: dbError } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ repositories: data })
}

// POST /api/repositories — add repo from GitHub
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = AddRepoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 })
  }

  const { githubRepoId, name, fullName, htmlUrl, isPrivate } = parsed.data

  const { data, error: dbError } = await supabase
    .from('repositories')
    .upsert({
      user_id: user.id,
      github_repo_id: githubRepoId,
      name,
      full_name: fullName,
      html_url: htmlUrl,
      is_private: isPrivate,
    }, { onConflict: 'github_repo_id' })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ repository: data }, { status: 201 })
}
