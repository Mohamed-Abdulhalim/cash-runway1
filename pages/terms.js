import Head from 'next/head'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service — Cash Runway</title>
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
          <h1 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-2">Terms of Service</h1>
          <p className="text-sm text-[#6B6B6B] mb-10">Last updated: March 2026</p>

          <div className="space-y-8 text-[#3D3D3D]">

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">1. Acceptance of terms</h2>
              <p className="text-sm leading-relaxed">By using Cash Runway you agree to these terms. If you do not agree, do not use the service. Cash Runway is operated by Mohamed Abdelhalim, an individual developer.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">2. Description of service</h2>
              <p className="text-sm leading-relaxed">Cash Runway is a cash flow visibility tool that connects to your Xero account and provides a projected cash runway verdict based on your invoices, bills, and bank balance. It is provided as a tool to assist decision making — not as financial advice.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">3. Not financial advice</h2>
              <p className="text-sm leading-relaxed">The information provided by Cash Runway is for informational purposes only. It does not constitute financial, accounting, legal, or professional advice. Always consult a qualified professional before making financial decisions. Cash Runway accepts no liability for decisions made based on the verdicts or projections shown.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">4. Accuracy of projections</h2>
              <p className="text-sm leading-relaxed">Cash Runway generates projections based on data available in your Xero account at the time of sync. Projections are estimates only. They may not account for all future income, expenses, or obligations. The accuracy of the verdict depends entirely on the completeness and accuracy of your Xero data.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">5. Xero integration</h2>
              <p className="text-sm leading-relaxed">Cash Runway accesses your Xero account using read-only OAuth permissions granted by you. You are responsible for ensuring your Xero data is accurate and up to date. You can revoke access at any time from your Xero connected apps settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">6. Acceptable use</h2>
              <p className="text-sm leading-relaxed mb-2">You agree not to:</p>
              <ul className="text-sm space-y-1.5 list-disc list-inside text-[#6B6B6B]">
                <li>Use the service for any unlawful purpose</li>
                <li>Attempt to reverse engineer or copy the service</li>
                <li>Share your account credentials with others</li>
                <li>Use the service to process data you do not have rights to access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">7. Availability</h2>
              <p className="text-sm leading-relaxed">We aim to keep Cash Runway available at all times but do not guarantee uninterrupted access. We may suspend or discontinue the service at any time with reasonable notice where possible.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">8. Limitation of liability</h2>
              <p className="text-sm leading-relaxed">To the maximum extent permitted by law, Cash Runway and its operator shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including but not limited to financial loss resulting from reliance on projections.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">9. Changes to terms</h2>
              <p className="text-sm leading-relaxed">We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms. We will update the date at the top of this page when changes are made.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">10. Contact</h2>
              <p className="text-sm leading-relaxed">For any questions about these terms, email us at mohamed.data.solutions@gmail.com</p>
            </section>

          </div>
        </main>

        <footer className="border-t border-[#E8E6E0] px-6 py-6 mt-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <p className="text-xs text-[#BDBDBD]">© 2026 Cash Runway</p>
            <Link href="/privacy" className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </>
  )
}