import NextAuth from 'next-auth'
import { supabase } from '../../../lib/supabase'
import { storeTokens, listOrganisations } from '../../../lib/xero'

const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'accounting.invoices.read',
  'accounting.payments.read',
  'accounting.banktransactions.read',
  'accounting.reports.banksummary.read',
  'accounting.contacts.read',
].join(' ')

export const authOptions = {
  providers: [
    {
      id: 'xero',
      name: 'Xero',
      type: 'oauth',
      issuer: 'https://identity.xero.com',
      idToken: true,
      jwks_endpoint: 'https://identity.xero.com/.well-known/openid-configuration/jwks',
      authorization: {
        url: 'https://login.xero.com/identity/connect/authorize',
        params: { scope: SCOPES, response_type: 'code' },
      },
      token: { url: 'https://identity.xero.com/connect/token' },
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      client: { token_endpoint_auth_method: 'client_secret_post' },
      checks: ['state'],
      async profile(claims) {
        const name = [claims.given_name, claims.family_name].filter(Boolean).join(' ') || claims.name || claims.email || 'Xero user'
        const email = (claims.email || `xero-${claims.sub}@users.invalid`).toLowerCase()
        const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
        return { id: data?.id || claims.sub, name, email }
      },
    },
  ],

  callbacks: {
    async signIn({ user, account }) {
      let step = 'users'
      try {
        if (!process.env.TOKEN_ENCRYPTION_KEY) {
          step = 'key'
          throw new Error('TOKEN_ENCRYPTION_KEY is not set')
        }
        const { error } = await supabase
          .from('users')
          .upsert({ id: user.id, email: user.email, name: user.name, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        if (error) {
          const e = new Error(error.message)
          e.dbCode = error.code
          throw e
        }
        step = 'tokens'
        let tenantId
        try {
          const orgs = await listOrganisations(account.access_token)
          tenantId = orgs[0]?.id ?? null
        } catch {
          tenantId = null
        }
        await storeTokens(user.id, {
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: (account.expires_at || Math.floor(Date.now() / 1000) + 1800) * 1000,
          tenant_id: tenantId,
        })
        step = 'snapshot'
        await supabase.from('user_snapshots').delete().eq('user_id', user.id)
        return true
      } catch (err) {
        console.error(`sign-in failed at ${step}:`, err.message)
        const detail = String(err.dbCode || err.code || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 12)
        return `/?error=signin_${step}${detail ? `&detail=${detail}` : ''}`
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub
      session.user.name = token.name
      return session
    },
  },

  pages: { error: '/' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
