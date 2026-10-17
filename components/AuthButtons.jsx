import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'

export default function AuthButtons() {
  const { status } = useSession()
  if (status === 'authenticated') {
    return <Link href="/app" className="px-3.5 py-2 rounded-lg bg-[#1A1A1A] text-white font-medium hover:bg-[#333]">Open dashboard</Link>
  }
  return (
    <>
      <Link href="/demo" className="hidden sm:inline text-[#4B4B4B] hover:text-[#1A1A1A]">Try the demo</Link>
      <button type="button" onClick={() => signIn('xero', { callbackUrl: '/app?sync=1' })} className="px-3.5 py-2 rounded-lg bg-[#1A1A1A] text-white font-medium hover:bg-[#333]">
        Sign in with Xero
      </button>
    </>
  )
}
