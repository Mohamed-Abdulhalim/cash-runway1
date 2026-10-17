import { addDays, addMonths, daysBetween } from './dates.mjs'

export const HORIZON_DAYS = 60
export const HISTORY_DAYS = 90
export const OTHER_INCOME_WEIGHT = 0.8
export const BUFFER_DAYS = 14
export const FREQUENCIES = {
  weekly: { label: 'Weekly', step: d => addDays(d, 7) },
  fortnightly: { label: 'Every 2 weeks', step: d => addDays(d, 14) },
  monthly: { label: 'Monthly', step: d => addMonths(d, 1) },
  quarterly: { label: 'Quarterly', step: d => addMonths(d, 3) },
}

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function cadenceFor(intervalDays) {
  if (intervalDays >= 5 && intervalDays <= 10) return 'weekly'
  if (intervalDays > 10 && intervalDays <= 20) return 'fortnightly'
  if (intervalDays > 20 && intervalDays <= 45) return 'monthly'
  return null
}

export function detectRecurring(spendHistory, today) {
  const since = addDays(today, -HISTORY_DAYS)
  const byContact = new Map()
  for (const tx of spendHistory || []) {
    if (!tx.date || tx.date < since || tx.date > today || !(tx.amount > 0)) continue
    const key = (tx.contact || '').trim()
    if (!key) continue
    if (!byContact.has(key)) byContact.set(key, [])
    byContact.get(key).push(tx)
  }
  const out = []
  for (const [contact, txs] of byContact) {
    if (txs.length < 2) continue
    txs.sort((a, b) => (a.date < b.date ? -1 : 1))
    const gaps = txs.slice(1).map((t, i) => daysBetween(txs[i].date, t.date)).filter(g => g > 0)
    if (!gaps.length) continue
    const frequency = cadenceFor(median(gaps))
    if (!frequency) continue
    out.push({
      contact,
      frequency,
      amount: Math.round(median(txs.map(t => t.amount)) * 100) / 100,
      last_date: txs[txs.length - 1].date,
      occurrences: txs.length,
    })
  }
  return out.sort((a, b) => b.amount - a.amount)
}

function schedule(firstDate, frequency, from, until) {
  const step = FREQUENCIES[frequency]?.step
  if (!step || !firstDate) return []
  const dates = []
  let d = firstDate
  let guard = 0
  while (d < from && guard++ < 500) d = step(d)
  while (d <= until && guard++ < 1000) {
    dates.push(d)
    d = step(d)
  }
  return dates
}

export function computeRunway(snapshot, options = {}) {
  const today = options.today || snapshot.as_of
  const horizon = options.horizonDays || HORIZON_DAYS
  const last = addDays(today, horizon - 1)
  const commitments = options.commitments || []
  const events = []
  const risks = []

  const overdueReceivables = []
  for (const r of snapshot.receivables || []) {
    if (!(r.amount > 0) || !r.due_date) continue
    if (r.due_date < today) {
      overdueReceivables.push(r)
    } else if (r.due_date <= last) {
      events.push({ date: r.due_date, amount: r.amount, kind: 'invoice', label: r.contact || 'Invoice', ref: r.number })
    }
  }

  const overduePayables = []
  for (const p of snapshot.payables || []) {
    if (!(p.amount > 0)) continue
    if (!p.due_date || p.due_date < today) {
      overduePayables.push(p)
      events.push({ date: today, amount: -p.amount, kind: 'overdue_bill', label: p.contact || 'Overdue bill', ref: p.number })
    } else if (p.due_date <= last) {
      events.push({ date: p.due_date, amount: -p.amount, kind: 'bill', label: p.contact || 'Bill', ref: p.number })
    }
  }

  const recurring = detectRecurring(snapshot.spend_history, today)
  for (const r of recurring) {
    const first = FREQUENCIES[r.frequency].step(r.last_date)
    for (const date of schedule(first, r.frequency, addDays(today, 1), last)) {
      events.push({ date, amount: -r.amount, kind: 'recurring', label: r.contact })
    }
  }

  for (const c of commitments) {
    if (!(c.amount > 0)) continue
    for (const date of schedule(c.next_date, c.frequency, today, last)) {
      events.push({ date, amount: -c.amount, kind: 'commitment', label: c.label || 'Commitment' })
    }
  }

  const since = addDays(today, -HISTORY_DAYS)
  const otherIncome = (snapshot.income_history || [])
    .filter(t => t.date && t.date >= since && t.date <= today && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)
  const dailyOtherIncome = (otherIncome / HISTORY_DAYS) * OTHER_INCOME_WEIGHT
  if (dailyOtherIncome > 0) {
    for (let i = 1; i < horizon; i++) {
      events.push({ date: addDays(today, i), amount: dailyOtherIncome, kind: 'other_income', label: 'Other income (estimated)' })
    }
  }

  const byDay = new Map()
  for (const e of events) {
    if (!byDay.has(e.date)) byDay.set(e.date, [])
    byDay.get(e.date).push(e)
  }

  let balance = Number(snapshot.bank_balance) || 0
  const series = []
  let low = { date: today, balance }
  let firstShortfall = null
  for (let i = 0; i < horizon; i++) {
    const date = addDays(today, i)
    const dayEvents = (byDay.get(date) || []).sort((a, b) => a.amount - b.amount)
    for (const e of dayEvents) balance += e.amount
    series.push({ date, balance: Math.round(balance * 100) / 100 })
    if (balance < low.balance) low = { date, balance }
    if (balance < 0 && !firstShortfall) firstShortfall = date
  }

  const sum = kind => events.filter(e => e.kind === kind).reduce((s, e) => s + e.amount, 0)
  const totals = {
    invoices: sum('invoice'),
    other_income: sum('other_income'),
    bills: -sum('bill'),
    overdue_bills: -sum('overdue_bill'),
    recurring: -sum('recurring'),
    commitments: -sum('commitment'),
    overdue_receivables: overdueReceivables.reduce((s, r) => s + r.amount, 0),
  }
  const totalOut = totals.bills + totals.overdue_bills + totals.recurring + totals.commitments
  const buffer = (totalOut / horizon) * BUFFER_DAYS

  let verdict = 'fine'
  if (low.balance < 0) verdict = 'at_risk'
  else if (low.balance < buffer) verdict = 'tight'

  if (firstShortfall) {
    risks.push({ kind: 'shortfall', date: firstShortfall, amount: low.balance, low_date: low.date })
  }
  if (overduePayables.length) {
    risks.push({ kind: 'overdue_bills', count: overduePayables.length, amount: totals.overdue_bills })
  }
  if (overdueReceivables.length) {
    risks.push({ kind: 'overdue_receivables', count: overdueReceivables.length, amount: totals.overdue_receivables })
  }

  const upcoming = events
    .filter(e => e.amount < 0 && e.kind !== 'other_income')
    .sort((a, b) => a.amount - b.amount || (a.date < b.date ? -1 : 1))
    .slice(0, 5)
    .map(e => ({ ...e, amount: -e.amount }))

  return {
    as_of: today,
    horizon_days: horizon,
    starting_balance: Number(snapshot.bank_balance) || 0,
    end_balance: series[series.length - 1].balance,
    low_point: { date: low.date, balance: Math.round(low.balance * 100) / 100 },
    first_shortfall: firstShortfall,
    buffer: Math.round(buffer * 100) / 100,
    verdict,
    totals,
    risks,
    recurring,
    largest_outflows: upcoming,
    series,
  }
}
