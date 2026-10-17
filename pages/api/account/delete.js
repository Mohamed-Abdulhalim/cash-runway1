import { requireUser, sendError } from '../../../lib/session'
import { revokeAndForget } from '../../../lib/xero'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  const userId = await requireUser(req, res)
  if (!userId) return
  try {
    await revokeAndForget(userId)
    res.json({ ok: true })
  } catch (err) {
    sendError(res, err)
  }
}
