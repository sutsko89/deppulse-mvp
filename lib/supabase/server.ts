/**
 * Server-side Supabase clients.
 *
 * We intentionally avoid @supabase/ssr's createServerClient because its
 * TypeScript overloads do not correctly propagate the Database generic in
 * the versions compatible with Next.js 15, causing all table types to
 * resolve as `never`.
 *
 * Instead we use the canonical @supabase/supabase-js createClient and
 * inject the auth cookie manually so session-based auth still works.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Server client with user session.
 * Reads the Supabase auth cookie and passes it as a global header so the
 * PostgREST RLS policies see the correct JWT.
 */
export async function createClient() {
  const cookieStore = await cookies()

  // Collect all cookies into a single Cookie header string.
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Cookie: cookieHeader,
      },
    },
    auth: {
      // Disable auto-refresh / storage in server context.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Admin client with service role key (bypasses RLS).
 * Use only in trusted server-side code (webhooks, cron jobs, etc.).
 */
export async function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
