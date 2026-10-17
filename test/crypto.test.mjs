import test from 'node:test'
import assert from 'node:assert/strict'

test('tokens round-trip through AES-GCM and plaintext passes through', async () => {
  process.env.TOKEN_ENCRYPTION_KEY = 'test-key'
  const { encrypt, decrypt } = await import('../lib/crypto.js')
  const enc = encrypt('secret-token')
  assert.ok(enc.startsWith('enc:v1:'))
  assert.notEqual(enc, encrypt('secret-token'))
  assert.equal(decrypt(enc), 'secret-token')
  assert.equal(decrypt('legacy-plain'), 'legacy-plain')
})
