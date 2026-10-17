import test from 'node:test'
import assert from 'node:assert/strict'
import { computeRunway, detectRecurring } from '../lib/runway/engine.mjs'
import { addDays, addMonths, toDay } from '../lib/runway/dates.mjs'
import { demoData } from '../lib/runway/demo.mjs'

const today = '2026-10-17'
const base = { as_of: today, bank_balance: 10000, receivables: [], payables: [], income_history: [], spend_history: [] }

test('xero dates parse from both formats', () => {
  assert.equal(toDay('/Date(1760659200000+0000)/'), '2025-10-17')
  assert.equal(toDay('2026-11-01T00:00:00'), '2026-11-01')
  assert.equal(toDay(null), null)
})

test('addMonths clamps to month end', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28')
})

test('overdue bills are paid today, not ignored', () => {
  const r = computeRunway({ ...base, payables: [{ amount: 4000, due_date: '2026-09-01' }] }, { today })
  assert.equal(r.series[0].balance, 6000)
  assert.equal(r.totals.overdue_bills, 4000)
  assert.ok(r.risks.some(x => x.kind === 'overdue_bills'))
})

test('overdue invoices are not counted as income but are flagged', () => {
  const r = computeRunway({ ...base, receivables: [{ amount: 5000, due_date: '2026-10-01' }] }, { today })
  assert.equal(r.end_balance, 10000)
  assert.equal(r.totals.overdue_receivables, 5000)
})

test('confirmed invoices count in full on their due date', () => {
  const r = computeRunway({ ...base, receivables: [{ amount: 3000, due_date: '2026-10-20' }] }, { today })
  assert.equal(r.series[2].balance, 10000)
  assert.equal(r.series[3].balance, 13000)
})

test('other income is weighted once at 80% and spread daily', () => {
  const r = computeRunway({ ...base, income_history: [{ date: '2026-09-01', amount: 9000 }] }, { today })
  assert.ok(Math.abs(r.totals.other_income - 9000 / 90 * 0.8 * 59) < 0.01)
})

test('weekly supplier is projected weekly, not once a month', () => {
  const spend = [-63, -56, -49, -42, -35, -28, -21, -14, -7].map(n => ({ contact: 'Weekly Co', date: addDays(today, n), amount: 500 }))
  const rec = detectRecurring(spend, today)
  assert.equal(rec[0].frequency, 'weekly')
  const r = computeRunway({ ...base, spend_history: spend }, { today })
  assert.ok(r.totals.recurring >= 500 * 8 && r.totals.recurring <= 500 * 9)
})

test('one-off and irregular spend is not projected', () => {
  const spend = [{ contact: 'Once', date: '2026-09-10', amount: 900 }, { contact: 'Odd', date: '2026-07-25', amount: 50 }, { contact: 'Odd', date: '2026-10-10', amount: 50 }]
  assert.equal(detectRecurring(spend, today).length, 0)
})

test('manual commitments such as payroll are projected', () => {
  const r = computeRunway(base, { today, commitments: [{ label: 'Payroll', amount: 6000, frequency: 'monthly', next_date: '2026-10-28' }] })
  assert.equal(r.totals.commitments, 12000)
  assert.equal(r.verdict, 'at_risk')
  assert.equal(r.first_shortfall, '2026-11-28')
})

test('verdict tiers: fine, tight, at risk', () => {
  const bills = n => ({ ...base, payables: [{ amount: n, due_date: '2026-11-01' }] })
  assert.equal(computeRunway(bills(1000), { today }).verdict, 'fine')
  assert.equal(computeRunway(bills(9900), { today }).verdict, 'tight')
  assert.equal(computeRunway(bills(12000), { today }).verdict, 'at_risk')
})

test('low point and shortfall date are reported', () => {
  const r = computeRunway({ ...base, payables: [{ amount: 12000, due_date: '2026-10-25' }], receivables: [{ amount: 5000, due_date: '2026-11-05' }] }, { today })
  assert.equal(r.first_shortfall, '2026-10-25')
  assert.deepEqual(r.low_point, { date: '2026-10-25', balance: -2000 })
  assert.equal(r.end_balance, 3000)
})

test('demo company produces a tight or at-risk story with all features', () => {
  const { snapshot, commitments } = demoData(today)
  const r = computeRunway(snapshot, { today: snapshot.as_of, commitments })
  assert.ok(['tight', 'at_risk'].includes(r.verdict))
  assert.ok(r.recurring.some(x => x.frequency === 'weekly'))
  assert.ok(r.recurring.some(x => x.frequency === 'fortnightly'))
  assert.ok(r.totals.overdue_bills > 0 && r.totals.overdue_receivables > 0)
  assert.ok(!r.recurring.some(x => x.contact === 'Office Chairs Ltd'))
})
