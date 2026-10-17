import { requireUser, sendError } from '../../lib/session'
import { supabase } from '../../lib/supabase'
import { cleanCommitments } from '../../lib/runway/commitments.mjs'

export default async function handler(req, res) {
  const userId = await requireUser(req, res)
  if (!userId) return

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('user_settings').select('commitments').eq('user_id', userId).maybeSingle()
      if (error) throw new Error(error.message)
      return res.json({ commitments: data?.commitments || [] })
    }
    if (req.method === 'PUT') {
      let commitments
      try {
        commitments = cleanCommitments(req.body?.commitments)
      } catch (e) {
        return res.status(400).json({ error: 'invalid', message: e.message })
      }
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, commitments, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) throw new Error(error.message)
      return res.json({ commitments })
    }
    res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    sendError(res, err)
  }
}
