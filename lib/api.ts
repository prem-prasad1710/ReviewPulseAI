import { NextResponse } from 'next/server'
import { reportException } from '@/lib/report-exception'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function err(message: string, status = 400, cause?: unknown) {
  if (status >= 500) {
    reportException(cause instanceof Error ? cause : new Error(message), {
      tags: { source: 'api' },
      extra: { status, message },
    })
  }
  return NextResponse.json({ success: false, error: message }, { status })
}
