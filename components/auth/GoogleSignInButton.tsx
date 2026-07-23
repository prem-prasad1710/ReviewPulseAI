'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

/** Uses the browser origin for Google OAuth callback (fixes custom-domain sign-in). */
export default function GoogleSignInButton({
  callbackUrl,
  className,
  children = 'Continue with Google',
}: {
  callbackUrl: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <Button
      type="button"
      className={className}
      onClick={() => {
        void signIn('google', { callbackUrl })
      }}
    >
      {children}
    </Button>
  )
}
