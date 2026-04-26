import type React from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-sm', className)} {...props} />
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700', className)} {...props} />
  )
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-slate-100 px-3 py-3 text-slate-700', className)} {...props} />
}
