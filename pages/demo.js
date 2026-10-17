import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import AuthButtons from '../components/AuthButtons'
import Dashboard from '../components/Dashboard'
import { computeRunway } from '../lib/runway/engine.mjs'
import { demoData } from '../lib/runway/demo.mjs'

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return { props: demoData() }
}

export default function Demo({ snapshot, commitments: initial }) {
  const [commitments, setCommitments] = useState(initial)
  const result = useMemo(
    () => computeRunway(snapshot, { today: snapshot.as_of, commitments: commitments.filter(c => c.amount > 0 && c.next_date) }),
    [snapshot, commitments]
  )
  return (
    <Layout title="Demo" description="Cash Runway with a sample UK design studio: a 60-day cash verdict, balance projection and the payments that drive it." right={<AuthButtons />}>
      <div className="max-w-3xl mx-auto px-5 py-8">
        <Dashboard
          result={result}
          currency={snapshot.base_currency}
          orgName={snapshot.org_name}
          syncedLabel="Sample data, refreshed daily"
          commitments={commitments}
          onCommitmentsChange={setCommitments}
          notice={
            <div className="rounded-xl border border-[#E8E6E0] bg-white px-4 py-3 text-sm text-[#4B4B4B]">
              This is a made-up company. Try changing payroll below and watch the verdict update. Nothing is saved.
            </div>
          }
        />
      </div>
    </Layout>
  )
}
