import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Get authenticated user (server-side).
 * Uses getUser() which validates the JWT with Supabase Auth server.
 * Never use getSession() for authorization — it reads from cookie without validation.
 */
export async function getAuthUser(): Promise<User> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user
}

/**
 * Get user profile from public.profiles
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw new Error(`Failed to get user profile: ${error.message}`)
  return data
}

/**
 * Upsert profile after GitHub OAuth login.
 * Called from auth callback.
 */
export async function upsertProfile(user: User) {
  const supabase = await createClient()

  const githubId = user.user_metadata?.provider_id
    ? Number(user.user_metadata.provider_id)
    : user.user_metadata?.user_name
      ? 0
      : 0

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    github_id: githubId,
    email: user.email ?? null,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'id',
  })

  if (error) throw new Error(`Failed to upsert profile: ${error.message}`)
}

/**
 * Sign in with GitHub via Supabase OAuth
 */
export async function signInWithGitHub(redirectTo?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback${
        redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''
      }`,
      scopes: 'read:user user:email repo',
    },
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
