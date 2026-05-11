import { createHash } from 'node:crypto'

/** Stable key so we never re-call Translate when the source text + language are unchanged. */
export function translationContentFingerprint(languageIso1: string, comment: string): string {
  return createHash('sha256').update(`${languageIso1}|${comment}`, 'utf8').digest('hex')
}
