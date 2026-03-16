import NextAuth from 'next-auth'
import { supabase } from '../../../lib/supabase'

export const authOptions = {
  providers: [
    {
      id: 'xero',
      name: 'Xero',
      type: 'oauth',
      authorization: {
        url: 'https://login.xero.com/identity/connect/authorize',
        params: {
          scope: 'accounting.invoices accounting.payments accounting.contacts accounting.settings offline_access',
          response_type: 'code',
        }
      },
      token: {
        url: 'https://identity.xero.com/connect/token',
      },
      userinfo: {
        async request({ tokens }) {
          const res = await fetch('https://api.xero.com/connections', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          })
          const connections = await res.json()
          return {
            sub: connections?.[0]?.tenantId ?? tokens.access_token.substring(0, 20),
            name: connections?.[0]?.tenantName ?? 'Xero User',
            email: `xero_${connections?.[0]?.tenantId}@cashrunway.app`,
            tenantId: connections?.[0]?.tenantId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_at,
          }
        }
      },
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      client: {
        token_endpoint_auth_method: 'client_secret_post',
      },
      checks: ['state'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          tenantId: profile.tenantId,
        }
      }
    }
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            name: user.name,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })

        if (userError) {
          console.error('signIn upsert failed:', userError.message)
          return false
        }

        const { error: tokenError } = await supabase
          .from('user_tokens')
          .upsert({
            user_id: user.id,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            tenant_id: profile?.tenantId ?? null,
            expires_at: account.expires_at * 1000,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (tokenError) {
          console.error('token upsert failed:', tokenError.message)
          return false
        }

        return true
      } catch (err) {
        console.error('signIn error:', err.message)
        return false
      }
    },

    async session({ session, token }) {
      session.user.id = token.sub
      session.user.name = token.name
      return session
    },

    async jwt({ token, user, profile }) {
      if (user) {
        token.sub = user.id
        token.name = user.name
      }
      return token
    },
  },

  session: {
    strategy: 'jwt'
  },

  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)