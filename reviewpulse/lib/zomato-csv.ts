import crypto from 'node:crypto'

export type ParsedZomatoRow = {
  reviewerName: string
  rating: number
  comment: string
  reviewCreatedAt: Date
  externalKey: string
  rawRowHash: string
}

function normalizeHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Map common Zomato / aggregator export headers (EN). */
function pickColumn(headerToIndex: Map<string, number>, aliases: string[]): number | undefined {
  for (const a of aliases) {
    const idx = headerToIndex.get(normalizeHeader(a))
    if (idx !== undefined) return idx
  }
  return undefined
}

/** Minimal RFC4180-style CSV line parser (handles quoted fields). */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
      continue
    }
    if (c === ',') {
      row.push(cur)
      cur = ''
      continue
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1
      row.push(cur)
      cur = ''
      if (row.some((cell) => cell.trim().length > 0)) rows.push(row)
      row = []
      continue
    }
    cur += c
  }
  row.push(cur)
  if (row.some((cell) => cell.trim().length > 0)) rows.push(row)
  return rows
}

function parseRating(raw: string): number {
  const s = raw.trim()
  const n = Number.parseFloat(s.replace(/[^0-9.]/g, ''))
  if (Number.isFinite(n)) {
    const rounded = Math.round(n)
    return Math.min(5, Math.max(1, rounded))
  }
  return 3
}

function parseDate(raw: string): Date {
  const d = new Date(raw.trim())
  if (!Number.isNaN(d.getTime())) return d
  return new Date()
}

export function parseZomatoReviewCsv(csvText: string): ParsedZomatoRow[] {
  const rows = parseCsvRows(csvText.trim())
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => normalizeHeader(h))
  const headerToIndex = new Map<string, number>()
  headers.forEach((h, i) => headerToIndex.set(h, i))

  const idxRating = pickColumn(headerToIndex, [
    'rating',
    'stars',
    'star rating',
    'food rating',
    'overall rating',
    'score',
  ])
  const idxText = pickColumn(headerToIndex, [
    'review',
    'review text',
    'comment',
    'feedback',
    'review comment',
    'customer review',
    'description',
  ])
  const idxName = pickColumn(headerToIndex, [
    'reviewer',
    'customer name',
    'name',
    'user',
    'diner',
    'customer',
    'reviewer name',
  ])
  const idxDate = pickColumn(headerToIndex, [
    'date',
    'review date',
    'reviewed on',
    'posted on',
    'order date',
    'created at',
  ])

  if (idxRating === undefined && idxText === undefined) {
    throw new Error(
      'Could not detect rating or review columns. Expected headers like "Rating", "Review", "Reviewer", "Date".'
    )
  }

  const out: ParsedZomatoRow[] = []
  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r]
    const rating = idxRating !== undefined ? parseRating(cells[idxRating] || '3') : 3
    const comment = idxText !== undefined ? String(cells[idxText] || '').trim() : ''
    const reviewerName =
      idxName !== undefined ? String(cells[idxName] || '').trim() || 'Zomato user' : 'Zomato user'
    const reviewCreatedAt = idxDate !== undefined ? parseDate(cells[idxDate] || '') : new Date()
    const keyBase = `${reviewerName}|${rating}|${comment.slice(0, 80)}|${reviewCreatedAt.toISOString().slice(0, 10)}`
    const rawRowHash = crypto.createHash('sha256').update(cells.join('|')).digest('hex').slice(0, 40)
    const externalKey = crypto.createHash('sha256').update(keyBase).digest('hex').slice(0, 32)
    if (!comment && !idxText && idxRating === undefined) continue
    out.push({ reviewerName, rating, comment, reviewCreatedAt, externalKey, rawRowHash })
  }
  return out
}
