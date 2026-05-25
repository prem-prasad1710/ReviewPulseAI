import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** MongoDB ObjectId as lowercase/upper hex string (without optional quotes). */
export const MONGO_OBJECT_ID_HEX_RE = /^[a-f0-9]{24}$/i

export function isMongoObjectIdString(value: string): boolean {
  return MONGO_OBJECT_ID_HEX_RE.test(value.trim())
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatCurrencyINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}
