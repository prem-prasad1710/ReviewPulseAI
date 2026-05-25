import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, BookOpen, ClipboardList, HeartPulse, LifeBuoy, Server, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

type DocTopic = {
  icon: LucideIcon
  title: string
  body: ReactNode
  mono?: string
}

const topics: DocTopic[] = [
  {
    icon: HeartPulse,
    title: 'What ReviewPulse ships',
    body: 'Reputation intelligence: review inbox & sentiment tooling, multilingual AI replies, dashboards, competitor and menu surfaces, WhatsApp bridges, Razorpay plans, public score embeds, developer API, cron-driven syncing and PDF/report generation.',
  },
  {
    icon: Server,
    title: 'Health endpoints',
    body: (
      <>
        Call <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">GET /api/health</code> for
        readiness (Mongo handshake). Use{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">GET /api/health?live=1</code> for
        liveness probes that must not touch the database.
      </>
    ),
  },
  {
    icon: ClipboardList,
    title: 'Feature catalog (Markdown)',
    body: 'Dashboard routes, REST inventory, cron jobs, embeds and security summaries live in:',
    mono: 'docs/FEATURE_CATALOG.md',
  },
  {
    icon: BookOpen,
    title: 'Environment variables',
    body: 'Required vs optional configuration (AI, Redis, Maps, Razorpay, Twilio, cron, blobs) is enumerated in:',
    mono: 'docs/ENVIRONMENT_VARIABLES.md',
  },
  {
    icon: ShieldCheck,
    title: 'Production checklist',
    body: 'Go-live readiness (secrets rotation, uptime probes, HSTS toggle, Razorpay webhooks, cron secret) follows:',
    mono: 'docs/PRODUCTION_CHECKLIST.md',
  },
  {
    icon: LifeBuoy,
    title: 'Implementation guide',
    body: 'MVP narratives plus integration snippets for engineers remain in:',
    mono: 'IMPLEMENTATION_GUIDE.md',
  },
]

export default function DocsPage() {
  return (
    <div className="space-y-8 pb-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
          Workspace
        </p>
        <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          Documentation hub
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Canonical technical references live beside the codebase in Markdown. Cursor, Git hosts, or your IDE can open files by path relative to the repo root.
        </p>
      </div>

      <Card className="border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/60 px-5 py-4 dark:border-indigo-500/30 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              Quick pointers
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              Scaffold local env vars from{' '}
              <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-950/70">.env.example</code> —
              copy to{' '}
              <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-950/70">.env.local</code>.
            </p>
          </div>
          <Link
            href="/developer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200/80 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:border-indigo-500/40 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-slate-800"
          >
            API console
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {topics.map(({ icon: Icon, title, body, mono }) => (
          <Card key={title} className="border-slate-200/90 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/55">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
                <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{body}</div>
                {mono ? (
                  <p className="mt-3 break-all text-xs font-mono text-indigo-600 dark:text-indigo-400">{mono}</p>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
