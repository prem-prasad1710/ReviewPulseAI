import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import FreeReplyTool from '@/components/tools/FreeReplyTool'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export const metadata: Metadata = {
  title: 'Free AI reply to bad Google reviews | ReviewPulse',
  description:
    'Paste a negative or mixed review — get a professional Hindi, English, or Hinglish reply in seconds. No login. Built for Indian restaurants, salons, and clinics.',
  openGraph: {
    title: 'Free AI reply generator — ReviewPulse',
    description: 'Turn angry reviews into professional Google replies. SEO-friendly free tool.',
  },
}

export default function FreeReplyPage() {
  return (
    <div className="bg-mesh relative min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <ArrowLeft className="h-4 w-4" />
          ReviewPulse
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
          Paste a bad review → get a calm, professional reply
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
          Free preview powered by the same AI stack as ReviewPulse. No account. Ideal for owners who are stuck staring at a 1★ or 2★ and need words fast.
        </p>
        <div className="mt-10">
          <FreeReplyTool />
        </div>
      </main>
    </div>
  )
}
