import { requireUser, sendError } from '../../lib/session'
import { supabase } from '../../lib/supabase'
import { computeRunway } from '../../lib/runway/engine.mjs'
import { todayUtc } from '../../lib/runway/dates.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })
  const userId = await requireUser(req, res)
  if (!userId) return

  try {
    const [{ data: snap, error: e1 }, { data: settings, error: e2 }] = await Promise.all([
      supabase.from('user_snapshots').select('data,last_synced_at').eq('user_id', userId).maybeSingle(),
      supabase.from('user_settings').select('commitments').eq('user_id', userId).maybeSingle(),
    ])
    if (e1) throw new Error(e1.message)
    if (e2) throw new Error(e2.message)
    if (!snap?.data || snap.data.version !== 2) return res.status(404).json({ error: 'no_snapshot' })

    const commitments = settings?.commitments || []
    const result = computeRunway(snap.data, { today: todayUtc(), commitments })
    res.json({
      org_name: snap.data.org_name,
      currency: snap.data.base_currency,
      bank_balance_found: snap.data.bank_balance_found !== false,
      last_synced_at: snap.last_synced_at,
      commitments,
      result,
    })
  } catch (err) {
    sendError(res, err)
  }
}
