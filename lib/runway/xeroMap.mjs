import { toDay } from './dates.mjs'

function toBase(amount, rate) {
  const value = Number(amount) || 0
  const r = Number(rate)
  return r > 0 && r !== 1 ? value / r : value
}

export function detectBaseCurrency(docs) {
  const counts = new Map()
  for (const d of docs) {
    if (!d?.CurrencyCode) continue
    if (d.CurrencyRate && Number(d.CurrencyRate) !== 1) continue
    counts.set(d.CurrencyCode, (counts.get(d.CurrencyCode) || 0) + 1)
  }
  let best = null
  for (const [code, n] of counts) if (!best || n > best[1]) best = [code, n]
  return best ? best[0] : null
}

export function mapDocument(inv) {
  const amount = toBase(inv.AmountDue, inv.CurrencyRate)
  return {
    id: inv.InvoiceID,
    number: inv.InvoiceNumber || inv.Reference || null,
    contact: inv.Contact?.Name || null,
    amount: Math.round(amount * 100) / 100,
    amount_original: Number(inv.AmountDue) || 0,
    currency: inv.CurrencyCode || null,
    due_date: toDay(inv.DueDate) || toDay(inv.Date),
  }
}

export function mapBankTransaction(tx) {
  return {
    contact: tx.Contact?.Name || null,
    date: toDay(tx.Date),
    amount: Math.round(toBase(tx.Total, tx.CurrencyRate) * 100) / 100,
  }
}

export function bankBalanceFromSummary(report) {
  const rows = report?.Reports?.[0]?.Rows ?? []
  let total = 0
  let found = false
  for (const section of rows) {
    if (section.RowType !== 'Section') continue
    for (const row of section.Rows ?? []) {
      if (row.RowType !== 'Row') continue
      const cells = row.Cells ?? []
      const value = parseFloat(String(cells[cells.length - 1]?.Value ?? '').replace(/,/g, ''))
      if (!Number.isNaN(value)) {
        total += value
        found = true
      }
    }
  }
  return found ? Math.round(total * 100) / 100 : null
}

export function buildSnapshot({ today, orgName, invoices, bills, receipts, spends, bankSummary }) {
  const docs = [...invoices, ...bills]
  return {
    version: 2,
    as_of: today,
    org_name: orgName || null,
    base_currency: detectBaseCurrency(docs),
    bank_balance: bankBalanceFromSummary(bankSummary) ?? 0,
    bank_balance_found: bankBalanceFromSummary(bankSummary) !== null,
    receivables: invoices.filter(i => Number(i.AmountDue) > 0).map(mapDocument),
    payables: bills.filter(b => Number(b.AmountDue) > 0).map(mapDocument),
    income_history: receipts.map(mapBankTransaction),
    spend_history: spends.map(mapBankTransaction),
  }
}
