import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  default: 'bg-[#2563EB] text-white hover:bg-[#1f56c8]',
  secondary: 'bg-[#E5EDFF] text-[#1E3A8A] hover:bg-[#d8e4ff]',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  destructive: 'bg-[#DC2626] text-white hover:bg-[#be1f1f]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
