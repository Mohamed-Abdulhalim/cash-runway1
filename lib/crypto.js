import crypto from 'crypto'

const PREFIX = 'enc:v1:'

function key() {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (!raw) return null
  return crypto.createHash('sha256').update(raw).digest()
}

export function encrypt(value) {
  if (value == null) return value
  const k = key()
  if (!k) throw new Error('TOKEN_ENCRYPTION_KEY is not set')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', k, iv)
  const body = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64')
}

export function decrypt(value) {
  if (value == null || !String(value).startsWith(PREFIX)) return value
  const k = key()
  if (!k) throw new Error('TOKEN_ENCRYPTION_KEY is not set')
  const buf = Buffer.from(String(value).slice(PREFIX.length), 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', k, buf.subarray(0, 12))
  decipher.setAuthTag(buf.subarray(12, 28))
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8')
}
