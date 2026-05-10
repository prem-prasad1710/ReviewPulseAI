'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  if (!mounted) {
    return (
      <Button type="button" variant="outline" size="sm" className={cn('h-8 w-8 rounded-xl p-0', className)} disabled aria-label="Theme">
        <span className="inline-block h-4 w-4" />
      </Button>
    )
  }

  const next = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        'h-8 w-8 rounded-xl border-slate-200 bg-white/80 p-0 dark:border-slate-600 dark:bg-slate-800/80',
        className
      )}
      aria-label={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
    >
      {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
    </Button>
  )
}
