import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertProfile } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[auth/callback] Error:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  try {
    await upsertProfile(data.user)
  } catch (err) {
    console.error('[auth/callback] Profile upsert failed:', err)
    // Non-fatal — user can still use the app
  }

  return NextResponse.redirect(`${origin}${next}`)
}
