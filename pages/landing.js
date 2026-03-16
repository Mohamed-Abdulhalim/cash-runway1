import Head from 'next/head'
import Link from 'next/link'
import { TrendingUp, Shield, Zap, Clock, CheckCircle, ArrowRight } from 'lucide-react'

export default function Landing() {
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
              <Link href="/privacy" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors hidden sm:block">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors hidden sm:block">
                Terms
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
              >
                Get started
              </Link>
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
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-4 bg-[#1A1A1A] text-white rounded-xl font-medium text-base hover:bg-[#333] transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2"
              >
                Connect Xero — it's free
                <ArrowRight size={16} />
              </Link>
              <p className="text-xs text-[#BDBDBD]">No credit card · Read-only access · 30 seconds</p>
            </div>
          </div>
        </section>

        {/* Verdict preview */}
        <section className="px-6 pb-20">
          <div className="max-w-lg mx-auto">
            <div className="fade-up delay-4 bg-white rounded-2xl border border-[#E8E6E0] shadow-xl shadow-black/5 overflow-hidden">
              {/* Mock header */}
              <div className="border-b border-[#F0EEE8] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#1A1A1A] rounded-md flex items-center justify-center">
                    <TrendingUp size={10} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#1A1A1A]">Cash Runway</span>
                </div>
                <span className="text-xs text-[#6B6B6B]">Acme Ltd</span>
              </div>

              {/* Mock verdict - fine */}
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
                {
                  step: '01',
                  title: 'Connect Xero',
                  desc: 'Sign in with your Xero account. Read-only access — we never write to your data.'
                },
                {
                  step: '02',
                  title: 'We do the math',
                  desc: 'We pull your invoices, bills, bank balance, and 90 days of transaction history.'
                },
                {
                  step: '03',
                  title: 'Get your verdict',
                  desc: "You're Fine or You're At Risk — with exactly which bill is causing the problem."
                }
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
                {
                  icon: Shield,
                  title: 'Read-only Xero access',
                  desc: 'We never write to your Xero account. Connect with confidence.'
                },
                {
                  icon: Zap,
                  title: 'Conservative projections',
                  desc: 'We weight invoices at 80% and factor in your last 90 days of income history.'
                },
                {
                  icon: Clock,
                  title: 'Always up to date',
                  desc: 'Sync anytime in one click. Your verdict reflects your current Xero data.'
                },
                {
                  icon: CheckCircle,
                  title: 'No spreadsheets',
                  desc: "One screen. One verdict. No formulas, no manual entry, no guessing."
                }
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
                {
                  type: 'Small business owners',
                  pain: 'Staring at their bank account every morning wondering if payroll is covered.',
                  fix: 'One verdict. No more guessing.'
                },
                {
                  type: 'Freelancers',
                  pain: 'Irregular income making it hard to know if upcoming bills are covered.',
                  fix: 'See your 60-day outlook in seconds.'
                },
                {
                  type: 'Bookkeepers',
                  pain: 'Clients calling in a panic asking if they can pay their bills.',
                  fix: 'Send them a verdict before they call.'
                }
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
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] text-white rounded-xl font-medium text-base hover:bg-[#333] transition-colors shadow-lg shadow-black/10"
            >
              Get started with Xero
              <ArrowRight size={16} />
            </Link>
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
              <a href="mailto:mohamed.data.solutions@gmail.com" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                Contact
              </a>
              <Link href="/privacy" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                Terms
              </Link>
            </div>
            <p className="text-xs text-[#BDBDBD]">© 2026 Cash Runway</p>
          </div>
        </footer>

      </div>
    </>
  )
}