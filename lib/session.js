import { getServerSession } from 'next-auth'
import { authOptions } from '../pages/api/auth/[...nextauth]'

export async function requireUser(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const id = session?.user?.id
  if (!id) {
    res.status(401).json({ error: 'not_signed_in' })
    return null
  }
  return id
}

export function sendError(res, err) {
  if (err?.code === 'reconnect') return res.status(409).json({ error: 'reconnect', message: err.message })
  console.error('api error:', err?.message)
  return res.status(500).json({ error: 'server_error' })
}
