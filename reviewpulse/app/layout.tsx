import type { Metadata } from 'next'
import { Manrope, Space_Grotesk } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ReviewPulse AI',
  description: 'Manage and auto-reply to Google reviews in seconds - in Hindi and English',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
