import type React from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-sm', className)} {...props} />
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'border-b border-slate-200/90 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300',
        className
      )}
      {...props}
    />
  )
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'border-b border-slate-100 px-3 py-3.5 text-sm text-slate-800 dark:border-slate-800/90 dark:text-slate-300',
        className
      )}
      {...props}
    />
  )
}
