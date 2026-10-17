import { requireUser, sendError } from '../../../lib/session'
import { xeroClient } from '../../../lib/xero'
import { supabase } from '../../../lib/supabase'
import { buildSnapshot } from '../../../lib/runway/xeroMap.mjs'
import { addDays, todayUtc } from '../../../lib/runway/dates.mjs'
import { HISTORY_DAYS } from '../../../lib/runway/engine.mjs'

function xeroDate(day) {
  const [y, m, d] = day.split('-').map(Number)
  return `DateTime(${y},${String(m).padStart(2, '0')},${String(d).padStart(2, '0')})`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  const userId = await requireUser(req, res)
  if (!userId) return

  try {
    const xero = await xeroClient(userId)
    const today = todayUtc()
    const since = xeroDate(addDays(today, -HISTORY_DAYS))

    const [invoices, bills, receipts, spends, bankSummary] = await Promise.all([
      xero.getAll('/api.xro/2.0/Invoices', 'Invoices', 'Status=="AUTHORISED"&&Type=="ACCREC"'),
      xero.getAll('/api.xro/2.0/Invoices', 'Invoices', 'Status=="AUTHORISED"&&Type=="ACCPAY"'),
      xero.getAll('/api.xro/2.0/BankTransactions', 'BankTransactions', `Type=="RECEIVE"&&Status=="AUTHORISED"&&Date>=${since}`),
      xero.getAll('/api.xro/2.0/BankTransactions', 'BankTransactions', `Type=="SPEND"&&Status=="AUTHORISED"&&Date>=${since}`),
      xero.get('/api.xro/2.0/Reports/BankSummary').catch(() => null),
    ])

    const snapshot = buildSnapshot({ today, orgName: xero.org.name, invoices, bills, receipts, spends, bankSummary })

    const { error } = await supabase.from('user_snapshots').upsert({
      user_id: userId,
      starting_cash: snapshot.bank_balance,
      inflows: [],
      outflows: [],
      data: snapshot,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw new Error(`Could not save snapshot: ${error.message}`)

    res.json({ ok: true, counts: { invoices: snapshot.receivables.length, bills: snapshot.payables.length } })
  } catch (err) {
    sendError(res, err)
  }
}
