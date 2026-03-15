import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Verdict from '../components/Verdict'
import RiskItems from '../components/RiskItems'
import { RefreshCw, LogOut, Zap, Shield, TrendingUp } from 'lucide-react'
import Head from 'next/head'

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
        if (json.error?.includes('token') || json.error?.includes('connected') || json.error?.includes('tenant')) {
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
    return <LandingPage onSignIn={() => signIn('google')} />
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
              <span className="text-sm text-[#6B6B6B]">{session?.user?.email}</span>
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
          {!data && !loading && !error && (
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
                
                  <a href="/api/auth/xero"
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
                <a href="/api/auth/xero" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors underline underline-offset-2">
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
        <title>Cash Runway — Know Before It's Too Late</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#F7F6F3] flex flex-col">

        {/* Nav */}
        <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="font-semibold text-[#1A1A1A] text-lg tracking-tight">Cash Runway</span>
          </div>
          <button
            onClick={onSignIn}
            className="text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
          >
            Sign in
          </button>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-2xl mx-auto w-full">

          <div className="inline-flex items-center gap-2 bg-white border border-[#E8E6E0] rounded-full px-4 py-1.5 text-xs text-[#6B6B6B] mb-8">
            <div className="w-1.5 h-1.5 bg-[#16A34A] rounded-full" />
            Free to use · Connects to Xero
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold text-[#1A1A1A] tracking-tight leading-tight mb-4">
            Can you cover<br />next month's bills?
          </h1>

          <p className="text-lg text-[#6B6B6B] mb-10 max-w-md leading-relaxed">
            Cash Runway connects to Xero and gives you one honest answer. No dashboards. No jargon. Just the truth.
          </p>

          <button
            onClick={onSignIn}
            className="px-8 py-4 bg-[#1A1A1A] text-white rounded-xl font-medium text-base hover:bg-[#333] transition-colors shadow-lg shadow-black/10"
          >
            Get started with Google
          </button>

          <p className="text-xs text-[#BDBDBD] mt-4">Free · No credit card · Xero required</p>

          {/* Trust signals */}
          <div className="mt-16 grid grid-cols-3 gap-6 w-full max-w-lg">
            {[
              { icon: Shield, label: 'Read-only access', sub: 'We never write to Xero' },
              { icon: Zap, label: '30 second setup', sub: 'Connect and get your verdict' },
              { icon: TrendingUp, label: '60 day outlook', sub: 'Conservative projections' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-white rounded-2xl border border-[#E8E6E0] p-4 text-left">
                <Icon size={16} className="text-[#1A1A1A] mb-2" />
                <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
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