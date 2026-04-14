import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Verdict from '../components/Verdict'
import RiskItems from '../components/RiskItems'
import { RefreshCw, LogOut, Zap, Shield, TrendingUp, ArrowRight, Clock, CheckCircle } from 'lucide-react'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [bankBalance, setBankBalance] = useState(0)
  const [xeroConnected, setXeroConnected] = useState(false)

  useEffect(() => {
    if (session) {
      const params = new URLSearchParams(window.location.search)
      if (params.get('sync') === 'true') {
        window.history.replaceState({}, '', '/')
        syncXero()
      } else {
        fetchRunway()
      }
    }
  }, [session])

  async function fetchRunway() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/runway/compute')
      if (res.status === 404) {
        setData(null)
        setXeroConnected(false)
        return
      }
      if (!res.ok) throw new Error('Failed to fetch runway')
      const json = await res.json()
      setData(json)
      setXeroConnected(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function syncXero() {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/xero/sync', { method: 'POST' })
      if (res.status === 400) {
        setError('xero_not_connected')
        return
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        if (
          json.error?.includes('token') ||
          json.error?.includes('connected') ||
          json.error?.includes('tenant') ||
          json.error?.includes('getTokens') ||
          json.error?.includes('getSnapshot')
        ) {
          setError('xero_not_connected')
          return
        }
        throw new Error('Sync failed')
      }
      if (!res.ok) throw new Error('Sync failed')
      await fetchRunway()
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  async function updateBalance() {
    setError(null)
    try {
      const res = await fetch('/api/xero/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual_balance: parseFloat(bankBalance) || 0 })
      })
      if (!res.ok) throw new Error('Update failed')
      await fetchRunway()
    } catch (err) {
      setError(err.message)
    }
  }

  if (status === 'loading') {
    return <SplashScreen />
  }

  if (status === 'unauthenticated') {
    return <LandingPage onSignIn={() => signIn('xero', { callbackUrl: '/?sync=true' })} />
  }

  return (
    <>
      <Head>
        <title>Cash Runway — Know Before It's Too Late</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#F7F6F3]">

        {/* Header */}
        <header className="border-b border-[#E8E6E0] bg-white px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-white" />
              </div>
              <span className="font-semibold text-[#1A1A1A] text-lg tracking-tight">Cash Runway</span>
            </div>
            <div className="flex items-center gap-4">
              {(
                <button
                  onClick={syncXero}
                  disabled={syncing}
                  className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync'}
                </button>
              )}
              <div className="h-4 w-px bg-[#E8E6E0]" />
              <span className="text-sm text-[#6B6B6B]">{session?.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-10">

          {/* Connect Xero */}
          {!data && !loading && !error && !syncing && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">Good to see you.</h1>
                <p className="text-[#6B6B6B] mt-1">Connect Xero to see your cash position in seconds.</p>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8E6E0] p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#F0FAF4] rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={18} className="text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Read-only access</p>
                    <p className="text-sm text-[#6B6B6B] mt-0.5">We only read your invoices and bills. We never write to your Xero account.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FFF8F0] rounded-xl flex items-center justify-center shrink-0">
                    <Zap size={18} className="text-[#EA580C]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Takes 30 seconds</p>
                    <p className="text-sm text-[#6B6B6B] mt-0.5">Authorise once. Your verdict updates every time you sync.</p>
                  </div>
                </div>
                
                <a href="/api/auth/signin/xero"
                  className="block w-full text-center py-3 px-6 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] transition-colors mt-2"
                >
                  Connect Xero
                </a>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw size={24} className="animate-spin text-[#6B6B6B]" />
              <p className="text-sm text-[#6B6B6B]">Calculating your runway...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-[#FFF8F0] border border-[#FED7AA] rounded-2xl p-5">
              {error === 'xero_not_connected' ? (
                <>
                  <p className="text-[#EA580C] text-sm font-medium">Xero not connected yet</p>
                  <p className="text-[#EA580C] text-xs mt-1 mb-3">Connect your Xero account first to get your cash runway verdict.</p>
                  
                    <a href="/api/auth/xero"
                    className="inline-block px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
                  >
                    Connect Xero
                  </a>
                </>
              ) : (
                <>
                  <p className="text-[#EA580C] text-sm font-medium">{error}</p>
                  <button onClick={fetchRunway} className="mt-2 text-sm text-[#EA580C] underline underline-offset-2">
                    Try again
                  </button>
                </>
              )}
            </div>
          )}

          {/* Verdict */}
          {data && !loading && (
            <div className="space-y-4">
              <Verdict
                verdict={data.verdict}
                cash_at_end={data.cash_at_end}
                has_projected={data.has_projected}
              />
              <RiskItems items={data.risk_items} />


              {/* Reconnect Xero */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-[#BDBDBD]">
                  Last synced: {data.last_synced_at ? new Date(data.last_synced_at).toLocaleString() : 'just now'}
                </p>
                <a href="/api/auth/signin/xero" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors underline underline-offset-2">
                  Reconnect Xero
                </a>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  )
}

function LandingPage({ onSignIn }) {
  return (
    <>
      <Head>
        <title>Cash Runway — Know if you can pay next month's bills</title>
        <meta name="description" content="Cash Runway connects to Xero and tells you in one screen whether you can cover next month's bills. No dashboards. No jargon. Just the truth." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-up { animation: fadeUp 0.5s ease forwards; opacity: 0; }
          .delay-1 { animation-delay: 0.1s; }
          .delay-2 { animation-delay: 0.2s; }
          .delay-3 { animation-delay: 0.3s; }
          .delay-4 { animation-delay: 0.4s; }
          .delay-5 { animation-delay: 0.5s; }
        `}</style>
      </Head>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#F7F6F3]">

        {/* Nav */}
        <nav className="px-6 py-5 border-b border-[#E8E6E0] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-white" />
              </div>
              <span className="font-semibold text-[#1A1A1A] text-lg tracking-tight">Cash Runway</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors hidden sm:block">Privacy</Link>
              <Link href="/terms" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors hidden sm:block">Terms</Link>
              <button
                onClick={onSignIn}
                className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
              >
                Get started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="px-6 py-20 sm:py-28 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="fade-up inline-flex items-center gap-2 bg-white border border-[#E8E6E0] rounded-full px-4 py-1.5 text-xs text-[#6B6B6B] mb-8">
              <div className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-pulse" />
              Built for Xero users · Free to use
            </div>
            <h1 className="fade-up delay-1 text-4xl sm:text-6xl font-semibold text-[#1A1A1A] tracking-tight leading-[1.1] mb-6">
              Can you cover<br />next month's bills?
            </h1>
            <p className="fade-up delay-2 text-lg sm:text-xl text-[#6B6B6B] mb-10 max-w-xl mx-auto leading-relaxed">
              Cash Runway connects to Xero and gives you one honest answer. No dashboards. No accountant jargon. Just the truth about your cash position.
            </p>
            <div className="fade-up delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onSignIn}
                className="w-full sm:w-auto px-8 py-4 bg-[#1A1A1A] text-white rounded-xl font-medium text-base hover:bg-[#333] transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2"
              >
                Connect Xero — it's free
                <ArrowRight size={16} />
              </button>
              <p className="text-xs text-[#BDBDBD]">No credit card · Read-only access · 30 seconds</p>
            </div>
          </div>
        </section>

        {/* Verdict preview */}
        <section className="px-6 pb-20">
          <div className="max-w-lg mx-auto">
            <div className="fade-up delay-4 bg-white rounded-2xl border border-[#E8E6E0] shadow-xl shadow-black/5 overflow-hidden">
              <div className="border-b border-[#F0EEE8] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#1A1A1A] rounded-md flex items-center justify-center">
                    <TrendingUp size={10} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#1A1A1A]">Cash Runway</span>
                </div>
                <span className="text-xs text-[#6B6B6B]">Acme Ltd</span>
              </div>
              <div className="p-6">
                <div className="bg-[#F0FAF4] border border-[#BBF7D0] rounded-2xl p-6 text-center mb-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    On track
                  </div>
                  <h2 className="text-3xl font-semibold text-[#15803D] tracking-tight">You're Fine</h2>
                  <p className="text-sm text-[#16A34A] mt-1">Projected cash in 60 days: $12,450.00</p>
                </div>
                <div className="flex items-center justify-between text-xs text-[#BDBDBD]">
                  <span>Last synced: just now</span>
                  <span>Based on 9 invoices · 12 bills</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-20 bg-white border-y border-[#E8E6E0]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-3">How it works</h2>
              <p className="text-[#6B6B6B]">Three steps. Thirty seconds. One answer.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Connect Xero', desc: 'Sign in with your Xero account. Read-only access — we never write to your data.' },
                { step: '02', title: 'We do the math', desc: 'We pull your invoices, bills, bank balance, and 90 days of transaction history.' },
                { step: '03', title: 'Get your verdict', desc: "You're Fine or You're At Risk — with exactly which bill is causing the problem." }
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div style={{ fontFamily: "'DM Mono', monospace" }} className="text-5xl font-medium text-[#E8E6E0] mb-4">{step}</div>
                  <h3 className="font-semibold text-[#1A1A1A] mb-2">{title}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-3">Built for busy owners</h2>
              <p className="text-[#6B6B6B]">Not accountants. Not CFOs. You.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Shield, title: 'Read-only Xero access', desc: 'We never write to your Xero account. Connect with confidence.' },
                { icon: Zap, title: 'Conservative projections', desc: 'We weight invoices at 80% and factor in your last 90 days of income history.' },
                { icon: Clock, title: 'Always up to date', desc: 'Sync anytime in one click. Your verdict reflects your current Xero data.' },
                { icon: CheckCircle, title: 'No spreadsheets', desc: "One screen. One verdict. No formulas, no manual entry, no guessing." }
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl border border-[#E8E6E0] p-6">
                  <div className="w-9 h-9 bg-[#F7F6F3] rounded-xl flex items-center justify-center mb-4">
                    <Icon size={16} className="text-[#1A1A1A]" />
                  </div>
                  <h3 className="font-semibold text-[#1A1A1A] mb-1.5">{title}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="px-6 py-20 bg-white border-y border-[#E8E6E0]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-3">Who uses Cash Runway</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { type: 'Small business owners', pain: 'Staring at their bank account every morning wondering if payroll is covered.', fix: 'One verdict. No more guessing.' },
                { type: 'Freelancers', pain: 'Irregular income making it hard to know if upcoming bills are covered.', fix: 'See your 60-day outlook in seconds.' },
                { type: 'Bookkeepers', pain: 'Clients calling in a panic asking if they can pay their bills.', fix: 'Send them a verdict before they call.' }
              ].map(({ type, pain, fix }) => (
                <div key={type} className="bg-[#F7F6F3] rounded-2xl p-6">
                  <p className="font-semibold text-[#1A1A1A] mb-3">{type}</p>
                  <p className="text-sm text-[#6B6B6B] mb-3 leading-relaxed">"{pain}"</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">→ {fix}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#1A1A1A] tracking-tight mb-4">
              Stop guessing.<br />Start knowing.
            </h2>
            <p className="text-[#6B6B6B] mb-8 leading-relaxed">
              Connect your Xero account and get your first verdict in 30 seconds. Free, forever.
            </p>
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] text-white rounded-xl font-medium text-base hover:bg-[#333] transition-colors shadow-lg shadow-black/10"
            >
              Get started with Xero
              <ArrowRight size={16} />
            </button>
            <p className="text-xs text-[#BDBDBD] mt-4">Free · No credit card · Xero required</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#E8E6E0] px-6 py-8 bg-white">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#1A1A1A] rounded-md flex items-center justify-center">
                <TrendingUp size={12} className="text-white" />
              </div>
              <span className="font-semibold text-[#1A1A1A] tracking-tight">Cash Runway</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="mailto:mohamed@halim.pro" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Contact</a>
              <Link href="/privacy" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Privacy</Link>
              <Link href="/terms" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Terms</Link>
            </div>
            <p className="text-xs text-[#BDBDBD]">© 2026 Cash Runway</p>
          </div>
        </footer>
      </div>
    </>
  )
}

function SplashScreen() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <RefreshCw size={20} className="animate-spin text-[#BDBDBD]" />
    </div>
  )
}
