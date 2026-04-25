/**
 * Verify GitHub webhook HMAC-SHA256 signature.
 */

export async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false

  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[webhook] GITHUB_WEBHOOK_SECRET not set — rejecting all webhooks')
    return false
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const hexMac = 'sha256=' + Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Timing-safe comparison
  if (hexMac.length !== signature.length) return false

  let mismatch = 0
  for (let i = 0; i < hexMac.length; i++) {
    mismatch |= hexMac.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return mismatch === 0
}
