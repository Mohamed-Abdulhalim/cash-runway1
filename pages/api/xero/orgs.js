import { requireUser, sendError } from '../../../lib/session'
import { getValidTokens, listOrganisations } from '../../../lib/xero'
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const userId = await requireUser(req, res)
  if (!userId) return

  try {
    const tokens = await getValidTokens(userId)
    const orgs = await listOrganisations(tokens.access_token)
    if (req.method === 'GET') {
      const selected = orgs.find(o => o.id === tokens.tenant_id)?.id || orgs[0]?.id || null
      return res.json({ orgs: orgs.map(({ id, name }) => ({ id, name })), selected })
    }
    if (req.method === 'POST') {
      const id = String(req.body?.tenant_id || '')
      if (!orgs.some(o => o.id === id)) return res.status(400).json({ error: 'unknown_org' })
      const { error } = await supabase.from('user_tokens').update({ tenant_id: id }).eq('user_id', userId)
      if (error) throw new Error(error.message)
      await supabase.from('user_snapshots').delete().eq('user_id', userId)
      return res.json({ selected: id })
    }
    res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    sendError(res, err)
  }
}
