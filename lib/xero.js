import { supabase } from './supabase'
import { encrypt, decrypt } from './crypto'

const TOKEN_URL = 'https://identity.xero.com/connect/token'
const REVOKE_URL = 'https://identity.xero.com/connect/revocation'
const API = 'https://api.xero.com'

export class ReconnectError extends Error {
  constructor(message = 'Xero connection expired') {
    super(message)
    this.code = 'reconnect'
  }
}

function basicAuth() {
  return 'Basic ' + Buffer.from(`${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString('base64')
}

export async function storeTokens(userId, { access_token, refresh_token, expires_at, tenant_id }) {
  const row = {
    user_id: userId,
    access_token: encrypt(access_token),
    refresh_token: encrypt(refresh_token),
    expires_at,
    updated_at: new Date().toISOString(),
  }
  if (tenant_id !== undefined) row.tenant_id = tenant_id
  const { error } = await supabase.from('user_tokens').upsert(row, { onConflict: 'user_id' })
  if (error) {
    const e = new Error(`Could not save Xero tokens: ${error.message}`)
    e.dbCode = error.code
    throw e
  }
}

async function readTokens(userId) {
  const { data, error } = await supabase.from('user_tokens').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(`Could not read Xero tokens: ${error.message}`)
  if (!data) throw new ReconnectError('Xero is not connected')
  return { ...data, access_token: decrypt(data.access_token), refresh_token: decrypt(data.refresh_token) }
}

async function refresh(userId, tokens) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.access_token) throw new ReconnectError(json.error || 'Xero refresh failed')
  const next = {
    access_token: json.access_token,
    refresh_token: json.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + (json.expires_in || 1800) * 1000,
  }
  await storeTokens(userId, next)
  return { ...tokens, ...next }
}

export async function getValidTokens(userId, { force = false } = {}) {
  const tokens = await readTokens(userId)
  if (force || !tokens.expires_at || Number(tokens.expires_at) - Date.now() < 120000) {
    return refresh(userId, tokens)
  }
  return tokens
}

export async function listOrganisations(accessToken) {
  const res = await fetch(`${API}/connections`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
  if (res.status === 401) throw new ReconnectError()
  const list = await res.json().catch(() => [])
  return (Array.isArray(list) ? list : [])
    .filter(c => !c.tenantType || c.tenantType === 'ORGANISATION')
    .map(c => ({ id: c.tenantId, name: c.tenantName, connection_id: c.id }))
}

export async function xeroClient(userId) {
  let tokens = await getValidTokens(userId)
  const orgs = await listOrganisations(tokens.access_token)
  if (!orgs.length) throw new ReconnectError('No Xero organisation is connected')
  const org = orgs.find(o => o.id === tokens.tenant_id) || orgs[0]

  async function get(path, params = {}, retried = false) {
    const url = new URL(API + path)
    for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokens.access_token}`, 'Xero-tenant-id': org.id, Accept: 'application/json' },
    })
    if (res.status === 401 && !retried) {
      tokens = await getValidTokens(userId, { force: true })
      return get(path, params, true)
    }
    if (res.status === 429 && !retried) {
      const wait = Math.min(Number(res.headers.get('retry-after')) || 2, 10)
      await new Promise(r => setTimeout(r, wait * 1000))
      return get(path, params, true)
    }
    if (res.status === 401 || res.status === 403) throw new ReconnectError()
    if (!res.ok) throw new Error(`Xero ${path} returned ${res.status}`)
    return res.json()
  }

  async function getAll(path, key, where, maxPages = 20) {
    const all = []
    for (let page = 1; page <= maxPages; page++) {
      const json = await get(path, { where, page, pageSize: 500 })
      const items = json?.[key] ?? []
      all.push(...items)
      if (items.length < 500) break
    }
    return all
  }

  return { org, orgs, get, getAll }
}

export async function revokeAndForget(userId) {
  let tokens = null
  try {
    tokens = await readTokens(userId)
  } catch {
    tokens = null
  }
  if (tokens?.refresh_token) {
    await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: tokens.refresh_token }),
    }).catch(() => null)
  }
  for (const table of ['user_snapshots', 'user_settings', 'user_tokens']) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error && !/does not exist/i.test(error.message)) throw new Error(`Could not delete ${table}: ${error.message}`)
  }
  const { error } = await supabase.from('users').delete().eq('id', userId)
  if (error) throw new Error(`Could not delete user: ${error.message}`)
}
