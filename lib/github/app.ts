/**
 * GitHub App authentication.
 * Returns an installation access token for the configured installation.
 */

import { createAppAuth } from '@octokit/auth-app'

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required environment variable: ${name}`)
  return val
}

/**
 * Returns a short-lived installation access token for the GitHub App.
 * Token is valid for 1 hour — do not cache beyond that.
 */
export async function getInstallationToken(): Promise<string> {
  const appId = requireEnv('GITHUB_APP_ID')
  // Private key may have literal \n from env — normalise to actual newlines
  const privateKey = requireEnv('GITHUB_APP_PRIVATE_KEY').replace(/\\n/g, '\n')
  const installationId = parseInt(requireEnv('GITHUB_APP_INSTALLATION_ID'), 10)

  const auth = createAppAuth({
    appId,
    privateKey,
    installationId,
  })

  const result = await auth({ type: 'installation' })
  return result.token
}
