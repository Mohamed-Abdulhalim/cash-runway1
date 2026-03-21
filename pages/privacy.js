import Head from 'next/head'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — Cash Runway</title>
      </Head>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#F7F6F3]">
        <header className="border-b border-[#E8E6E0] bg-white px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-white" />
              </div>
              <span className="font-semibold text-[#1A1A1A] text-lg tracking-tight">Cash Runway</span>
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#6B6B6B] mb-10">Last updated: March 2026</p>

          <div className="space-y-8 text-[#3D3D3D]">

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">1. Who we are</h2>
              <p className="text-sm leading-relaxed">Cash Runway is an independent product built and operated by Mohamed Abdelhalim, an individual developer based in Egypt. You can contact us at mohamed@halim.pro.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">2. What data we collect</h2>
              <p className="text-sm leading-relaxed mb-3">When you connect your Xero account, we access and temporarily store:</p>
              <ul className="text-sm space-y-1.5 list-disc list-inside text-[#6B6B6B]">
                <li>Your Xero organisation name</li>
                <li>Invoice data (amounts, due dates, status)</li>
                <li>Bill data (amounts, due dates, status)</li>
                <li>Bank account balances</li>
                <li>Bank transaction history (last 90 days)</li>
              </ul>
              <p className="text-sm leading-relaxed mt-3">We do not collect your personal financial data beyond what is necessary to generate your cash runway verdict.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">3. How we use your data</h2>
              <p className="text-sm leading-relaxed">Your Xero data is used solely to calculate and display your cash runway verdict. We do not sell, share, or use your data for advertising, analytics, or any purpose other than providing the service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">4. Data storage</h2>
              <p className="text-sm leading-relaxed">Your data is stored securely using Supabase (hosted on AWS). We store a snapshot of your most recent sync. Previous snapshots are overwritten on each sync - we do not maintain a history of your financial data.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">5. Xero access</h2>
              <p className="text-sm leading-relaxed">Cash Runway connects to Xero using read-only OAuth access. We never write to your Xero account. You can revoke our access at any time from your Xero connected apps settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">6. Data retention</h2>
              <p className="text-sm leading-relaxed">We retain your data for as long as you have an active account. You can request deletion of your data at any time by emailing mohamed@halim.pro. We will delete all your data within 7 days of your request.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">7. Your rights</h2>
              <p className="text-sm leading-relaxed mb-2">You have the right to:</p>
              <ul className="text-sm space-y-1.5 list-disc list-inside text-[#6B6B6B]">
                <li>Access the data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent at any time by disconnecting Xero</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">8. Changes to this policy</h2>
              <p className="text-sm leading-relaxed">We may update this policy from time to time. We will notify users of significant changes by updating the date at the top of this page.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">9. Contact</h2>
              <p className="text-sm leading-relaxed">For any privacy related questions, email us at mohamed@halim.pro</p>
            </section>

          </div>
        </main>

        <footer className="border-t border-[#E8E6E0] px-6 py-6 mt-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <p className="text-xs text-[#BDBDBD]">© 2026 Cash Runway</p>
            <Link href="/terms" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              Terms of Service
            </Link>
          </div>
        </footer>
      </div>
    </>
  )
}