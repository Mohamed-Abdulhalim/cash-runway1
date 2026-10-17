import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight, Eye, Lock, Calculator, Ban } from 'lucide-react'
import Layout from '../components/Layout'
import AuthButtons from '../components/AuthButtons'
import BalanceChart from '../components/BalanceChart'
import { computeRunway } from '../lib/runway/engine.mjs'
import { demoData } from '../lib/runway/demo.mjs'
import { money, longDate } from '../lib/format'

export async function getStaticProps() {
  const { snapshot, commitments } = demoData()
  const result = computeRunway(snapshot, { today: snapshot.as_of, commitments })
  return { props: { preview: { result, currency: snapshot.base_currency } }, revalidate: 3600 }
}

const steps = [
  { Icon: Lock, title: 'Connect Xero, read-only', text: 'Sign in with Xero. Cash Runway can read invoices, bills and bank data, and cannot change anything.' },
  { Icon: Calculator, title: 'Add what Xero does not know', text: 'Payroll, VAT and loan repayments usually live outside bills. Add them once with their amount and date.' },
  { Icon: Eye, title: 'Get a 60-day verdict', text: 'A day-by-day projection of your bank balance, the lowest point, and exactly which payments cause it.' },
]

const counts = [
  'Bank balance from your Xero bank summary',
  'Unpaid invoices in full on their due date',
  'Unpaid bills on their due date, overdue bills today',
  'Recurring spending found in 90 days of bank history: weekly, fortnightly or monthly',
  'Other income from the last 90 days, at 80%',
  'Payroll, tax and any commitments you add',
  'Foreign-currency invoices converted at the Xero rate',
]

const ignores = [
  'Overdue invoices: shown as a risk, never counted as income',
  'Invoices you have not raised yet',
  'Payments scheduled outside Xero',
]

const ERRORS = {
  signin_key: 'Sign-in failed: the server is missing its token encryption key (TOKEN_ENCRYPTION_KEY).',
  signin_users: 'Sign-in failed while saving your account to the database (users table).',
  signin_tokens: 'Sign-in failed while saving your Xero connection (user_tokens table).',
  signin_snapshot: 'Sign-in failed while resetting your previous sync (user_snapshots table).',
  OAuthCallback: 'Xero sent you back, but the sign-in could not be completed (OAuth callback error).',
  OAuthSignin: 'Could not start the Xero sign-in (OAuth sign-in error).',
  AccessDenied: 'Sign-in was cancelled or denied.',
  Callback: 'Sign-in failed during the callback step.',
  Configuration: 'The server sign-in configuration is incomplete.',
}

function SignInError() {
  const router = useRouter()
  const code = router.isReady ? String(router.query.error || '') : ''
  if (!code) return null
  return (
    <div className="max-w-5xl mx-auto px-5 pt-6">
      <div className="rounded-xl border border-[#FECACA] bg-[#FFF5F5] px-4 py-3 text-sm text-[#991B1B]">
        {ERRORS[code] || 'Sign-in failed.'} <span className="text-[#B91C1C]/70">Error code: {code}</span>
      </div>
    </div>
  )
}

export default function Home({ preview }) {
  const r = preview.result
  return (
    <Layout right={<AuthButtons />}>
      <SignInError />
      <section className="max-w-5xl mx-auto px-5 pt-14 pb-10 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div>
          <p className="text-sm font-medium text-[#6B6B6B]">For small businesses on Xero</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">Will your cash cover the next 60 days?</h1>
          <p className="mt-5 text-lg text-[#4B4B4B] max-w-xl">Cash Runway reads your Xero invoices, bills and bank history, adds payroll and tax, and tells you plainly if and when your bank balance drops below zero.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/demo" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A1A1A] text-white font-medium hover:bg-[#333]">
              See it with a sample company <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-4 text-sm text-[#9A9A9A]">The demo needs no sign-in. Connecting your own Xero is free and read-only.</p>
        </div>
        <Link href="/demo" className="block bg-white rounded-2xl border border-[#E8E6E0] p-5 shadow-sm hover:shadow-md transition-shadow" aria-label="Open the sample company dashboard">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#B91C1C]">Sample company</span>
            <span className="text-xs text-[#9A9A9A]">next 60 days</span>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#B91C1C]">{r.verdict === 'at_risk' ? "You're at risk" : r.verdict === 'tight' ? "It's tight" : "You're fine"}</p>
          <p className="text-sm text-[#4B4B4B]">
            {r.first_shortfall ? `Cash runs out on ${longDate(r.first_shortfall)}.` : `Lowest point ${money(r.low_point.balance, preview.currency)}.`}
          </p>
          <div className="mt-3">
            <BalanceChart series={r.series} buffer={r.buffer} currency={preview.currency} low={r.low_point} />
          </div>
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-10">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {steps.map(({ Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl border border-[#E8E6E0] p-5">
              <Icon size={18} className="text-[#6B6B6B]" />
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-[#6B6B6B]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-10 grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#E8E6E0] p-6">
          <h2 className="text-lg font-semibold">What the verdict counts</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-[#4B4B4B]">
            {counts.map(c => <li key={c} className="flex gap-2.5"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0" />{c}</li>)}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8E6E0] p-6">
          <h2 className="text-lg font-semibold">What it deliberately leaves out</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-[#4B4B4B]">
            {ignores.map(c => <li key={c} className="flex gap-2.5"><Ban size={14} className="mt-0.5 text-[#9A9A9A] shrink-0" />{c}</li>)}
          </ul>
          <p className="mt-5 text-sm text-[#6B6B6B]">The verdict errs on the cautious side. &ldquo;Fine&rdquo; means the balance stays above two weeks of average spending, &ldquo;tight&rdquo; means it stays positive but dips below that, &ldquo;at risk&rdquo; means it goes below zero.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 pt-4 pb-16">
        <div className="rounded-2xl border border-[#E8E6E0] bg-white p-6 text-sm text-[#4B4B4B]">
          <p><span className="font-medium text-[#1A1A1A]">About this project.</span> Cash Runway is a free portfolio project showing a full Xero integration: OAuth with token refresh, paginated API sync, multi-currency handling and a tested cash projection engine. In 2026 Xero began rolling out its own Cash Flow Manager inside Xero Analytics, so check that first if you just need a forecast. The <a className="underline" href="https://github.com/Mohamed-Abdulhalim/cash-runway1">source code</a> is public.</p>
        </div>
      </section>
    </Layout>
  )
}
