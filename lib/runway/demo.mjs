import { addDays, addMonths, todayUtc } from './dates.mjs'

function nextDayOfMonth(today, day) {
  const d = new Date(today + 'T00:00:00Z')
  const candidate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), day)).toISOString().slice(0, 10)
  return candidate >= today ? candidate : addMonths(candidate, 1)
}

export function demoData(today = todayUtc()) {
  const t = n => addDays(today, n)
  const snapshot = {
    version: 2,
    as_of: today,
    org_name: 'Harbour & Pine Studio Ltd (sample company)',
    base_currency: 'GBP',
    bank_balance: 21450,
    receivables: [
      { id: 'd-i1', number: 'INV-0412', contact: 'Northwind Retail', amount: 8400, due_date: t(9), currency: 'GBP' },
      { id: 'd-i2', number: 'INV-0415', contact: 'Fenwick & Co', amount: 3200, due_date: t(21), currency: 'GBP' },
      { id: 'd-i3', number: 'INV-0417', contact: 'Atlas Outdoor (USD)', amount: 4740, due_date: t(38), currency: 'USD', amount_original: 6000 },
      { id: 'd-i4', number: 'INV-0398', contact: 'Brightwave Media', amount: 5600, due_date: t(-17), currency: 'GBP' },
      { id: 'd-i5', number: 'INV-0420', contact: 'Kestrel Homes', amount: 2950, due_date: t(52), currency: 'GBP' },
    ],
    payables: [
      { id: 'd-b1', number: 'BILL-221', contact: 'PrintHaus', amount: 1840, due_date: t(-6), currency: 'GBP' },
      { id: 'd-b2', number: 'BILL-224', contact: 'Studio Equipment Hire', amount: 2600, due_date: t(12), currency: 'GBP' },
      { id: 'd-b3', number: 'BILL-226', contact: 'Insurance Direct', amount: 1450, due_date: t(25), currency: 'GBP' },
    ],
    income_history: [
      { date: t(-80), amount: 650 },
      { date: t(-52), amount: 420 },
      { date: t(-23), amount: 780 },
    ],
    spend_history: [
      ...[-88, -58, -27].map(n => ({ contact: 'Canal Street Lettings', date: t(n), amount: 2400 })),
      ...[-84, -70, -56, -42, -28, -14].map(n => ({ contact: 'J. Okafor (freelance)', date: t(n), amount: 1150 })),
      ...[-89, -82, -75, -68, -61, -54, -47, -40, -33, -26, -19, -12, -5].map(n => ({ contact: 'Fuel & Travel', date: t(n), amount: 95 })),
      ...[-75, -45, -15].map(n => ({ contact: 'Adobe', date: t(n), amount: 62 })),
      { contact: 'Office Chairs Ltd', date: t(-40), amount: 900 },
    ],
  }
  const commitments = [
    { id: 'd-c1', label: 'Payroll', amount: 11200, frequency: 'monthly', next_date: nextDayOfMonth(today, 28) },
    { id: 'd-c2', label: 'VAT return', amount: 7300, frequency: 'quarterly', next_date: t(33) },
  ]
  return { snapshot, commitments }
}
