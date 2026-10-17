import { AlertTriangle, CheckCircle2, CircleAlert, Repeat, Plus, Trash2 } from 'lucide-react'
import BalanceChart from './BalanceChart'
import { money, longDate, shortDate } from '../lib/format'
import { FREQUENCIES } from '../lib/runway/engine.mjs'

const TONE = {
  fine: { box: 'bg-[#F0FAF4] border-[#BBF7D0]', text: 'text-[#15803D]', pill: 'bg-[#DCFCE7] text-[#15803D]', label: 'On track', title: "You're fine", Icon: CheckCircle2 },
  tight: { box: 'bg-[#FFFBEB] border-[#FDE68A]', text: 'text-[#B45309]', pill: 'bg-[#FEF3C7] text-[#B45309]', label: 'Watch closely', title: "It's tight", Icon: CircleAlert },
  at_risk: { box: 'bg-[#FFF5F5] border-[#FECACA]', text: 'text-[#B91C1C]', pill: 'bg-[#FEE2E2] text-[#B91C1C]', label: 'Action needed', title: "You're at risk", Icon: AlertTriangle },
}

function Card({ title, children, aside }) {
  return (
    <section className="bg-white rounded-2xl border border-[#E8E6E0] overflow-hidden">
      {title && (
        <div className="px-5 py-3.5 border-b border-[#F0EEE8] flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">{title}</h3>
          {aside}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

function Row({ label, value, sub, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-[#4B4B4B]">{label}{sub && <span className="block text-xs text-[#9A9A9A]">{sub}</span>}</span>
      <span className={`text-sm tabular-nums ${strong ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  )
}

function Verdict({ result, currency }) {
  const t = TONE[result.verdict] || TONE.fine
  const low = result.low_point
  let line
  if (result.verdict === 'at_risk') {
    line = `Cash runs out on ${longDate(result.first_shortfall)} and bottoms at ${money(low.balance, currency)} on ${longDate(low.date)}.`
  } else if (result.verdict === 'tight') {
    line = `Lowest point is ${money(low.balance, currency)} on ${longDate(low.date)}, below a two-week buffer of ${money(result.buffer, currency)}.`
  } else {
    line = `Lowest point is ${money(low.balance, currency)} on ${longDate(low.date)}. You end the ${result.horizon_days} days at ${money(result.end_balance, currency)}.`
  }
  return (
    <div className={`rounded-2xl border p-6 sm:p-8 ${t.box}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${t.pill}`}>{t.label}</span>
          <h2 className={`mt-3 text-3xl sm:text-4xl font-semibold tracking-tight ${t.text}`}>{t.title}</h2>
          <p className="mt-2 text-[#3B3B3B] max-w-xl">{line}</p>
        </div>
        <t.Icon className={`shrink-0 ${t.text}`} size={36} strokeWidth={1.6} />
      </div>
    </div>
  )
}

function Risks({ result, currency }) {
  const items = []
  const overdueIn = result.risks.find(r => r.kind === 'overdue_receivables')
  const overdueOut = result.risks.find(r => r.kind === 'overdue_bills')
  const short = result.risks.find(r => r.kind === 'shortfall')
  if (short) {
    items.push({ tone: 'red', title: `Shortfall from ${longDate(short.date)}`, text: `The balance goes below zero and reaches ${money(short.amount, currency)} on ${longDate(short.low_date)}.` })
  }
  if (overdueOut) {
    items.push({ tone: 'red', title: `${overdueOut.count} overdue bill${overdueOut.count > 1 ? 's' : ''}: ${money(overdueOut.amount, currency)}`, text: 'Treated as paid today, because the money is already owed.' })
  }
  if (overdueIn) {
    const lifted = result.low_point.balance + overdueIn.amount
    items.push({
      tone: 'amber',
      title: `${overdueIn.count} overdue invoice${overdueIn.count > 1 ? 's' : ''}: ${money(overdueIn.amount, currency)}`,
      text: `Not counted, because there is no reliable date. Collecting ${overdueIn.count > 1 ? 'them' : 'it'} would lift your lowest point to about ${money(lifted, currency)}.`,
    })
  }
  if (!items.length) return null
  return (
    <Card title="What drives the verdict">
      <ul className="space-y-4">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${it.tone === 'red' ? 'bg-[#DC2626]' : 'bg-[#D97706]'}`} />
            <div>
              <p className="text-sm font-medium">{it.title}</p>
              <p className="text-sm text-[#6B6B6B]">{it.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function CommitmentsEditor({ commitments, onChange, saving, currency }) {
  const update = (i, patch) => onChange(commitments.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const remove = i => onChange(commitments.filter((_, j) => j !== i))
  const add = () => onChange([...commitments, { id: `c${Date.now()}`, label: 'Payroll', amount: 0, frequency: 'monthly', next_date: new Date().toISOString().slice(0, 10) }])
  return (
    <Card
      title="Payroll, tax and other commitments"
      aside={saving ? <span className="text-xs text-[#9A9A9A]">Saving…</span> : null}
    >
      <p className="text-sm text-[#6B6B6B] mb-4">Xero bills and bank history do not include payroll or VAT. Add them here so the verdict sees them.</p>
      <div className="space-y-3">
        {commitments.map((c, i) => (
          <div key={c.id} className="grid grid-cols-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto] gap-2 items-center">
            <input aria-label="Name" className="col-span-2 sm:col-span-1 min-w-0 w-full border border-[#E8E6E0] rounded-lg px-3 py-2 text-sm" value={c.label} maxLength={60} onChange={e => update(i, { label: e.target.value })} />
            <input aria-label={`Amount${currency ? ` in ${currency}` : ''}`} type="number" min="0" step="1" className="min-w-0 w-full border border-[#E8E6E0] rounded-lg px-3 py-2 text-sm tabular-nums" value={c.amount || ''} placeholder="Amount" onChange={e => update(i, { amount: Number(e.target.value) })} />
            <select aria-label="How often" className="min-w-0 w-full border border-[#E8E6E0] rounded-lg px-3 py-2 text-sm bg-white" value={c.frequency} onChange={e => update(i, { frequency: e.target.value })}>
              {Object.entries(FREQUENCIES).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
            </select>
            <input aria-label="Next payment date" type="date" className="min-w-0 w-full border border-[#E8E6E0] rounded-lg px-2 py-2 text-sm" value={c.next_date} onChange={e => update(i, { next_date: e.target.value })} />
            <button type="button" onClick={() => remove(i)} className="justify-self-end p-2 text-[#9A9A9A] hover:text-[#DC2626]" aria-label={`Remove ${c.label}`}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline">
        <Plus size={15} /> Add a commitment
      </button>
    </Card>
  )
}

export default function Dashboard({ result, currency, orgName, syncedLabel, commitments, onCommitmentsChange, saving, notice }) {
  const t = result.totals
  const moneyIn = t.invoices + t.other_income
  const moneyOut = t.bills + t.overdue_bills + t.recurring + t.commitments
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm text-[#6B6B6B]">{orgName}</p>
          <p className="text-xs text-[#9A9A9A]">Next {result.horizon_days} days from {longDate(result.as_of)}{currency ? ` · ${currency}` : ''}</p>
        </div>
        {syncedLabel && <p className="text-xs text-[#9A9A9A]">{syncedLabel}</p>}
      </div>

      {notice}
      <Verdict result={result} currency={currency} />

      <Card title="Projected bank balance">
        <BalanceChart series={result.series} buffer={result.buffer} currency={currency} low={result.low_point} />
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Risks result={result} currency={currency} />
        <Card title="Where the money goes">
          <Row label="Bank balance today" value={money(result.starting_balance, currency)} strong />
          <div className="border-t border-[#F0EEE8] my-2" />
          <Row label="Invoices due" sub="Counted in full on the due date" value={`+${money(t.invoices, currency)}`} />
          <Row label="Other income" sub="Last 90 days of receipts, counted at 80%" value={`+${money(t.other_income, currency)}`} />
          <Row label="Bills due" value={`−${money(t.bills, currency)}`} />
          {t.overdue_bills > 0 && <Row label="Overdue bills" sub="Paid today" value={`−${money(t.overdue_bills, currency)}`} />}
          <Row label="Recurring spending" sub="Detected from bank history" value={`−${money(t.recurring, currency)}`} />
          <Row label="Your commitments" sub="Payroll, tax and others you added" value={`−${money(t.commitments, currency)}`} />
          <div className="border-t border-[#F0EEE8] my-2" />
          <Row label={`Balance in ${result.horizon_days} days`} value={money(result.end_balance, currency)} strong />
          <p className="text-xs text-[#9A9A9A] mt-1">In {money(moneyIn, currency)} · out {money(moneyOut, currency)}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Biggest payments ahead">
          <ul className="divide-y divide-[#F0EEE8]">
            {result.largest_outflows.map((o, i) => (
              <li key={i} className="flex justify-between gap-4 py-2 text-sm">
                <span>{o.label}<span className="block text-xs text-[#9A9A9A]">{shortDate(o.date)} · {o.kind === 'overdue_bill' ? 'overdue bill' : o.kind === 'commitment' ? 'your commitment' : o.kind === 'recurring' ? 'recurring' : 'bill'}</span></span>
                <span className="tabular-nums">{money(o.amount, currency)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Recurring spending we found" aside={<Repeat size={15} className="text-[#9A9A9A]" />}>
          {result.recurring.length ? (
            <ul className="divide-y divide-[#F0EEE8]">
              {result.recurring.map(r => (
                <li key={r.contact} className="flex justify-between gap-4 py-2 text-sm">
                  <span>{r.contact}<span className="block text-xs text-[#9A9A9A]">{FREQUENCIES[r.frequency].label.toLowerCase()} · seen {r.occurrences} times</span></span>
                  <span className="tabular-nums">{money(r.amount, currency)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6B6B6B]">No regular payments found in the last 90 days of spend-money transactions.</p>
          )}
        </Card>
      </div>

      {onCommitmentsChange && (
        <CommitmentsEditor commitments={commitments} onChange={onCommitmentsChange} saving={saving} currency={currency} />
      )}
    </div>
  )
}
