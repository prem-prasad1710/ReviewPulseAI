import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizeClass = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' } as const

export function Spinner({ className, size = 'md' }: { className?: string; size?: keyof typeof sizeClass }) {
  return (
    <Loader2
      className={cn('animate-spin text-indigo-600 dark:text-indigo-400', sizeClass[size], className)}
      aria-hidden
    />
  )
}
