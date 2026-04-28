import NextAuth, { type NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { connectDB } from '@/lib/mongodb'
import { provisionLocationsFromGoogleOAuth } from '@/lib/provision-google-locations'
import User from '@/models/User'

if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_INSECURE_TLS_FOR_DEV === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const googleScope = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/business.manage',
].join(' ')

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { scope: googleScope, access_type: 'offline', prompt: 'consent' } },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      try {
        const next = new URL(url)
        if (next.origin === baseUrl) return url
      } catch {
        /* ignore */
      }
      return `${baseUrl}/dashboard`
    },
    async signIn({ user, account, profile }) {
      try {
        await connectDB()
        if (!user.email || !account || !profile) return false

        const googleId = account.providerAccountId
        const dbUser = await User.findOneAndUpdate(
          { email: user.email },
          {
            $set: {
              googleId,
              email: user.email,
              name: user.name ?? 'User',
              image: user.image,
            },
            $setOnInsert: {
              plan: 'free',
              subscriptionStatus: 'inactive',
              repliesUsedThisMonth: 0,
              repliesResetAt: new Date(),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        if (
          account.provider === 'google' &&
          dbUser?._id &&
          typeof account.access_token === 'string' &&
          account.access_token &&
          typeof account.refresh_token === 'string' &&
          account.refresh_token
        ) {
          const raw = account.expires_at
          const expiresAtMs =
            typeof raw === 'number' && raw > 0 ? (raw < 1e12 ? raw * 1000 : raw) : Date.now() + 3600 * 1000
          try {
            const { upserted, error } = await provisionLocationsFromGoogleOAuth({
              userId: dbUser._id,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAtMs,
            })
            if (error) console.error('GBP location import:', error)
            else if (upserted > 0) console.info(`GBP: upserted ${upserted} location(s) for ${user.email}`)
          } catch (e) {
            console.error('GBP location import failed:', e)
          }
        }

        return true
      } catch (error) {
        console.error('Auth signIn callback failed:', error)
        return '/login?error=DatabaseConnection'
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        await connectDB()
        const dbUser = await User.findOne({ email: user.email }).select('_id plan').lean()
        if (dbUser) {
          token.id = String(dbUser._id)
          token.plan = dbUser.plan
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? '')
        session.user.plan = (token.plan as string | undefined) ?? 'free'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
