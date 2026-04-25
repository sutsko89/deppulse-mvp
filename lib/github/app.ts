/**
 * GitHub App authentication.
 * Creates Installation Tokens using the App's private key.
 * Used for webhook-triggered scans (no user session available).
 */

import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'

function getAppCredentials() {
  const appId = process.env.GH_APP_ID
  const privateKey = process.env.GH_APP_PRIVATE_KEY
  const installationId = process.env.GH_APP_INSTALLATION_ID

  if (!appId || !privateKey || !installationId) {
    throw new Error('Missing GitHub App credentials: GH_APP_ID, GH_APP_PRIVATE_KEY, GH_APP_INSTALLATION_ID')
  }

  return {
    appId: Number(appId),
    // GitHub secrets replace newlines with literal \n — restore them
    privateKey: privateKey.replace(/\\n/g, '\n'),
    installationId: Number(installationId),
  }
}

/**
 * Get an Octokit instance authenticated as the GitHub App Installation.
 * Use this for webhook-triggered scans.
 */
export async function getAppOctokit(): Promise<Octokit> {
  const { appId, privateKey, installationId } = getAppCredentials()

  const auth = createAppAuth({ appId, privateKey, installationId })
  const { token } = await auth({ type: 'installation' })

  return new Octokit({ auth: token })
}

/**
 * Get a raw installation token string.
 * Useful when passing the token to runScan().
 */
export async function getInstallationToken(): Promise<string> {
  const { appId, privateKey, installationId } = getAppCredentials()

  const auth = createAppAuth({ appId, privateKey, installationId })
  const { token } = await auth({ type: 'installation' })

  return token
}
