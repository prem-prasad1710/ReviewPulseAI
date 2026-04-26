import NextAuth, { type NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import { connectDB } from '@/lib/mongodb'
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
    async signIn({ user, account, profile }) {
      try {
        await connectDB()
        if (!user.email || !account || !profile) return false

        const googleId = account.providerAccountId
        await User.findOneAndUpdate(
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
