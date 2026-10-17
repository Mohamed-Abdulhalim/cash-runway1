import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { RefreshCw, LogOut } from 'lucide-react'
import Layout from '../components/Layout'
import Dashboard from '../components/Dashboard'

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E0] p-6">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      <div className={title ? 'mt-2' : ''}>{children}</div>
    </div>
  )
}

function relative(iso) {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Synced just now'
  if (mins < 60) return `Synced ${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `Synced ${hours} h ago`
  return `Synced ${Math.round(hours / 24)} days ago`
}

export default function App() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [state, setState] = useState({ phase: 'loading' })
  const [syncing, setSyncing] = useState(false)
  const [orgs, setOrgs] = useState({ orgs: [], selected: null })
  const [commitments, setCommitments] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const saveTimer = useRef(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/runway')
    if (res.status === 404) return setState({ phase: 'empty' })
    if (res.status === 409) return setState({ phase: 'reconnect' })
    if (!res.ok) return setState({ phase: 'error' })
    const json = await res.json()
    setCommitments(json.commitments || [])
    setState({ phase: 'ready', data: json })
  }, [])

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/xero/sync', { method: 'POST' })
      if (res.status === 409) return setState({ phase: 'reconnect' })
      if (!res.ok) return setState({ phase: 'error' })
      await load()
    } finally {
      setSyncing(false)
    }
  }, [load])

  const loadOrgs = useCallback(async () => {
    const res = await fetch('/api/xero/orgs')
    if (res.ok) setOrgs(await res.json())
  }, [])

  const started = useRef(false)
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/')
    if (status !== 'authenticated' || !router.isReady || started.current) return
    started.current = true
    loadOrgs()
    if (router.query.sync) {
      router.replace('/app', undefined, { shallow: true })
      sync()
    } else {
      load()
    }
  }, [status, router, load, loadOrgs, sync])

  async function chooseOrg(id) {
    setSyncing(true)
    const res = await fetch('/api/xero/orgs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: id }) })
    setSyncing(false)
    if (res.ok) {
      setOrgs(o => ({ ...o, selected: id }))
      sync()
    }
  }

  function changeCommitments(next) {
    setCommitments(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const valid = next.filter(c => c.label && c.amount > 0 && c.next_date)
      setSaving(true)
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commitments: valid }) })
      setSaving(false)
      if (res.ok) load()
    }, 700)
  }

  async function deleteEverything() {
    if (!window.confirm('Disconnect Xero and permanently delete all your Cash Runway data?')) return
    setDeleting(true)
    const res = await fetch('/api/account/delete', { method: 'POST' })
    setDeleting(false)
    if (res.ok) signOut({ callbackUrl: '/?deleted=1' })
    else window.alert('Could not delete your data. Please email mohamed@halim.pro.')
  }

  const right = status === 'authenticated' && (
    <>
      <button type="button" onClick={sync} disabled={syncing} className="inline-flex items-center gap-1.5 text-[#4B4B4B] hover:text-[#1A1A1A] disabled:opacity-50">
        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing' : 'Sync'}
      </button>
      <span className="hidden sm:inline text-[#9A9A9A] truncate max-w-[10rem]">{session?.user?.name}</span>
      <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="text-[#4B4B4B] hover:text-[#1A1A1A]" aria-label="Sign out">
        <LogOut size={15} />
      </button>
    </>
  )

  const data = state.data
  return (
    <Layout title="Your runway" right={right}>
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">
        {orgs.orgs.length > 1 && (
          <label className="flex items-center gap-3 text-sm">
            <span className="text-[#6B6B6B]">Organisation</span>
            <select className="border border-[#E8E6E0] rounded-lg px-3 py-2 bg-white" value={orgs.selected || ''} onChange={e => chooseOrg(e.target.value)} disabled={syncing}>
              {orgs.orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        )}

        {(state.phase === 'loading' || (syncing && state.phase !== 'ready')) && (
          <div className="flex flex-col items-center py-24 gap-3 text-[#6B6B6B]">
            <RefreshCw size={22} className="animate-spin" />
            <p className="text-sm">{syncing ? 'Reading invoices, bills and bank history from Xero…' : 'Loading…'}</p>
          </div>
        )}

        {state.phase === 'empty' && !syncing && (
          <Panel title="No data yet">
            <p className="text-sm text-[#6B6B6B]">Run your first sync to pull invoices, bills and bank history from Xero.</p>
            <button type="button" onClick={sync} className="mt-4 px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm font-medium">Sync with Xero</button>
          </Panel>
        )}

        {state.phase === 'reconnect' && (
          <Panel title="Reconnect Xero">
            <p className="text-sm text-[#6B6B6B]">Your Xero connection expired or was removed. Sign in again to continue.</p>
            <button type="button" onClick={() => signIn('xero', { callbackUrl: '/app?sync=1' })} className="mt-4 px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm font-medium">Reconnect Xero</button>
          </Panel>
        )}

        {state.phase === 'error' && (
          <Panel title="Something went wrong">
            <p className="text-sm text-[#6B6B6B]">Xero or our database did not respond. Try syncing again in a minute.</p>
          </Panel>
        )}

        {state.phase === 'ready' && data && (
          <Dashboard
            result={data.result}
            currency={data.currency}
            orgName={data.org_name}
            syncedLabel={relative(data.last_synced_at)}
            commitments={commitments}
            onCommitmentsChange={changeCommitments}
            saving={saving}
            notice={!data.bank_balance_found && (
              <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
                We could not read a bank balance from Xero, so the projection starts at zero. Check that your bank accounts are set up in Xero.
              </div>
            )}
          />
        )}

        {status === 'authenticated' && (
          <div className="pt-6 border-t border-[#E8E6E0] text-sm text-[#6B6B6B] flex flex-wrap gap-x-4 gap-y-2 items-center justify-between">
            <span>Read-only access. Tokens are encrypted at rest.</span>
            <button type="button" onClick={deleteEverything} disabled={deleting} className="text-[#B91C1C] hover:underline disabled:opacity-50">
              {deleting ? 'Deleting…' : 'Disconnect Xero and delete my data'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
