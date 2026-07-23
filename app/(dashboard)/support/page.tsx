import type { Metadata } from 'next'
import SupportPageClient from '@/components/support/SupportPageClient'
import { APP_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Help & support — ${APP_NAME}`,
  description: `Contact ${APP_NAME} support for billing, Google OAuth, and product help.`,
}

export default function SupportPage() {
  return <SupportPageClient />
}
