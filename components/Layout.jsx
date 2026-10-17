import Head from 'next/head'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export default function Layout({ title, description, children, right }) {
  const fullTitle = title ? `${title} · Cash Runway` : 'Cash Runway · 60-day cash verdict for Xero'
  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={description || 'Connect Xero and see whether your cash covers the next 60 days of bills, payroll and tax. Read-only.'} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description || 'A 60-day cash verdict from your Xero invoices, bills and bank data.'} />
      </Head>
      <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A] flex flex-col">
        <header className="border-b border-[#E8E6E0] bg-white">
          <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="w-7 h-7 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-white" />
              </span>
              <span className="font-semibold tracking-tight">Cash Runway</span>
            </Link>
            <div className="flex items-center gap-3 text-sm min-w-0">{right}</div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#E8E6E0] bg-white">
          <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-sm text-[#6B6B6B]">
            <span>© {new Date().getFullYear()} Cash Runway · A portfolio project by <a className="underline hover:text-[#1A1A1A]" href="https://halim.pro">Mohamed Abdulhalim</a></span>
            <nav className="flex gap-4">
              <Link href="/demo" className="hover:text-[#1A1A1A]">Demo</Link>
              <Link href="/privacy" className="hover:text-[#1A1A1A]">Privacy</Link>
              <Link href="/terms" className="hover:text-[#1A1A1A]">Terms</Link>
              <a href="https://github.com/Mohamed-Abdulhalim/cash-runway1" className="hover:text-[#1A1A1A]">Source</a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  )
}
