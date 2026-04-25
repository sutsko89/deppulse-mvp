import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertProfile } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      try {
        await upsertProfile(user)
      } catch (profileError) {
        console.error('Failed to upsert profile:', profileError)
      }

      const redirectUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}/dashboard`
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
