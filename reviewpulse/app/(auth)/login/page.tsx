import { redirect } from 'next/navigation'
import { auth, signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const errorMessages: Record<string, string> = {
  AccessDenied: 'Sign in was denied. Please check Google OAuth test users and MongoDB connection.',
  DatabaseConnection: 'Database connection failed. Add your current IP in MongoDB Atlas Network Access.',
  Configuration: 'OAuth configuration issue detected. Verify Google OAuth client settings.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (session?.user?.id) redirect('/dashboard')

  const params = await searchParams
  const errorParam = params?.error
  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam
  const errorMessage = errorCode ? errorMessages[errorCode] || `Authentication error: ${errorCode}` : null

  return (
    <div className="grid min-h-[80vh] place-items-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">ReviewPulse AI</h1>
        <p className="mb-6 text-sm text-slate-600">
          Sign in with Google to connect your Business Profile and auto-reply to reviews.
        </p>

        {errorMessage ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/dashboard' })
          }}
        >
          <Button type="submit" className="w-full">
            Continue with Google
          </Button>
        </form>
      </div>
    </div>
  )
}
