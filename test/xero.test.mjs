import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSnapshot, mapDocument, detectBaseCurrency, bankBalanceFromSummary } from '../lib/runway/xeroMap.mjs'
import { cleanCommitments } from '../lib/runway/commitments.mjs'

const invoices = [
  { InvoiceID: 'a', InvoiceNumber: 'INV-1', Contact: { Name: 'Acme' }, AmountDue: 1200, CurrencyCode: 'GBP', CurrencyRate: 1, DueDate: '/Date(1763164800000+0000)/' },
  { InvoiceID: 'b', InvoiceNumber: 'INV-2', Contact: { Name: 'US Client' }, AmountDue: 1000, CurrencyCode: 'USD', CurrencyRate: 1.25, DueDateString: '2025-11-20T00:00:00', DueDate: '2025-11-20T00:00:00' },
  { InvoiceID: 'c', AmountDue: 0, CurrencyCode: 'GBP', CurrencyRate: 1, DueDate: '2025-11-01T00:00:00' },
]
const bills = [{ InvoiceID: 'd', Contact: { Name: 'Landlord' }, AmountDue: 2400, CurrencyCode: 'GBP', DueDate: '2025-11-01T00:00:00' }]
const summary = { Reports: [{ Rows: [
  { RowType: 'Header', Cells: [] },
  { RowType: 'Section', Rows: [
    { RowType: 'Row', Cells: [{ Value: 'Current' }, { Value: '100' }, { Value: '5,000.50' }] },
    { RowType: 'Row', Cells: [{ Value: 'Savings' }, { Value: '0' }, { Value: '1000' }] },
    { RowType: 'SummaryRow', Cells: [{ Value: 'Total' }, { Value: '' }, { Value: '6000.50' }] },
  ] },
] }] }

test('foreign-currency invoices are converted to base currency', () => {
  assert.equal(mapDocument(invoices[1]).amount, 800)
  assert.equal(mapDocument(invoices[1]).amount_original, 1000)
  assert.equal(mapDocument(invoices[0]).due_date, '2025-11-15')
})

test('base currency is detected from rate-1 documents', () => {
  assert.equal(detectBaseCurrency([...invoices, ...bills]), 'GBP')
})

test('bank summary sums account rows only, handles thousands separators', () => {
  assert.equal(bankBalanceFromSummary(summary), 6000.5)
  assert.equal(bankBalanceFromSummary(null), null)
})

test('snapshot drops fully paid documents', () => {
  const s = buildSnapshot({ today: '2025-10-17', orgName: 'Org', invoices, bills, receipts: [], spends: [], bankSummary: summary })
  assert.equal(s.receivables.length, 2)
  assert.equal(s.payables.length, 1)
  assert.equal(s.bank_balance, 6000.5)
  assert.equal(s.base_currency, 'GBP')
})

test('commitments are validated and cleaned', () => {
  const out = cleanCommitments([{ label: ' Payroll ', amount: '9800.456', frequency: 'monthly', next_date: '2026-10-28' }])
  assert.equal(out[0].label, 'Payroll')
  assert.equal(out[0].amount, 9800.46)
  assert.throws(() => cleanCommitments([{ label: 'x', amount: -1, frequency: 'monthly', next_date: '2026-10-28' }]))
  assert.throws(() => cleanCommitments([{ label: 'x', amount: 1, frequency: 'daily', next_date: '2026-10-28' }]))
  assert.throws(() => cleanCommitments('nope'))
})
