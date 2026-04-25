/**
 * GitHub webhook signature verification.
 * HMAC-SHA256 using the webhook secret.
 */

export async function verifyWebhookSignature(
  body: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false

  const secret = process.env.GH_WEBHOOK_SECRET
  if (!secret) throw new Error('GH_WEBHOOK_SECRET is not set')

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const hex = 'sha256=' + Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison
  if (hex.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < hex.length; i++) {
    diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}
