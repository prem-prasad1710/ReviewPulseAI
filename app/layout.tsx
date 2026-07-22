import type { Metadata } from 'next'
import { Manrope, Space_Grotesk } from 'next/font/google'
import { Toaster } from 'sonner'
import Providers from '@/components/providers/Providers'
import { getAppUrl } from '@/lib/app-url'
import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import './globals.css'
import { Analytics } from "@vercel/analytics/next";
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  adjustFontFallback: true,
})

const appUrl = getAppUrl()
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: `${APP_TAGLINE}. Sync Google reviews, draft bilingual AI replies, and publish with full control.`,
  applicationName: APP_NAME,
  keywords: ['Google reviews', 'Business Profile', 'AI replies', 'SMB', 'India', 'review management', 'ReviewsPulse'],
  authors: [{ name: APP_NAME }],
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: APP_NAME,
    title: `${APP_NAME} — Reply to every Google review in minutes`,
    description:
      'Connect locations, sync reviews, draft bilingual AI replies, and publish with full control.',
    url: appUrl,
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Google review inbox with Hindi and English AI replies`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: 'Google Business review management for Indian SMBs—secure, fast, bilingual.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased [text-rendering:optimizeLegibility]">
        <Providers>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
