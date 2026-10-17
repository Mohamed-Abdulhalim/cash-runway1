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
      profile(claims) {
        const name = [claims.given_name, claims.family_name].filter(Boolean).join(' ') || claims.name || claims.email || 'Xero user'
        return { id: claims.sub, name, email: claims.email || null }
      },
    },
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        const { error } = await supabase
          .from('users')
          .upsert({ id: user.id, email: user.email, name: user.name, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        if (error) throw new Error(error.message)
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
        await supabase.from('user_snapshots').delete().eq('user_id', user.id)
        return true
      } catch (err) {
        console.error('sign-in failed:', err.message)
        return '/?error=signin'
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
