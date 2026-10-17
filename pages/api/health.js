import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const { error } = await supabase.from('users').select('id', { head: true, count: 'exact' }).limit(1)
  res.setHeader('Cache-Control', 'no-store')
  if (error) return res.status(503).json({ ok: false })
  res.json({ ok: true })
}
