/**
 * Client-safe reply quality scorer (no API call needed).
 * Grades a draft reply on 7 signals — returns 0–100 score + actionable tips.
 */

export type ReplyQualityResult = {
  score: number              // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  label: string              // "Excellent" | "Good" | "Needs work" | "Poor" | "Very poor"
  tips: string[]             // short, actionable feedback strings
  highlights: string[]       // what's already good
}

const COMMON_FILLER = [
  'dear customer', 'dear valued customer', 'dear sir', 'dear madam',
  'dear guest', 'hello dear',
]

const GENERIC_OPENERS = [
  'thank you for your feedback', 'thank you for your review',
  'thanks for your review', 'thank you for visiting',
]

export function scoreReply(params: {
  replyText: string
  reviewerName: string
  reviewText?: string
  rating: number
}): ReplyQualityResult {
  const { replyText, reviewerName, reviewText = '', rating } = params
  const text = replyText.trim()
  const lower = text.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const tips: string[] = []
  const highlights: string[] = []
  let score = 0

  // 1. Length (0–20 pts)
  if (words.length >= 40 && words.length <= 120) {
    score += 20
    highlights.push('Good length')
  } else if (words.length >= 20 && words.length < 40) {
    score += 12
    tips.push('Add a bit more detail — 40–120 words feels complete without being overwhelming')
  } else if (words.length > 120) {
    score += 14
    tips.push('Reply is quite long — keep it under 120 words so customers read it fully')
  } else {
    score += 5
    tips.push('Reply is too short — expand with a specific detail or invitation to return')
  }

  // 2. Personalization: mentions reviewer name (0–15 pts)
  const firstName = reviewerName.split(/[\s,]+/)[0] || ''
  const nameUsed = firstName.length > 1 && lower.includes(firstName.toLowerCase())
  if (nameUsed) {
    score += 15
    highlights.push(`Uses ${firstName}'s name`)
  } else {
    tips.push(`Mention the reviewer's name (${firstName}) — it makes the reply feel personal`)
  }

  // 3. Avoids generic openers (0–10 pts)
  const usesGeneric = GENERIC_OPENERS.some((o) => lower.startsWith(o))
  const usesFiller = COMMON_FILLER.some((f) => lower.startsWith(f))
  if (!usesGeneric && !usesFiller) {
    score += 10
    highlights.push('Strong, non-generic opener')
  } else {
    tips.push('Start with something more specific than a generic "Thank you for your feedback" opener')
  }

  // 4. Acknowledges specific review content (0–15 pts)
  const reviewWords = reviewText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 30)
  const specificWords = reviewWords.filter((w) => lower.includes(w))
  if (specificWords.length >= 2) {
    score += 15
    highlights.push('References specific details from review')
  } else if (specificWords.length === 1) {
    score += 8
    tips.push('Reference 1–2 specific things the reviewer mentioned to show you actually read it')
  } else if (reviewText.trim().length > 10) {
    tips.push("Acknowledge something specific from the reviewer's comment")
  } else {
    score += 10
  }

  // 5. For low-star: includes an apology or fix (0–15 pts)
  if (rating <= 2) {
    const hasApology = ['sorry', 'apologize', 'apologies', 'regret', 'disappointed', 'will improve', 'माफ', 'खेद'].some(
      (w) => lower.includes(w)
    )
    const hasFix = ['contact', 'reach out', 'call us', 'dm', 'direct', 'address', 'resolve', 'fix', 'improve'].some(
      (w) => lower.includes(w)
    )
    if (hasApology && hasFix) {
      score += 15
      highlights.push('Apologises and offers a resolution path')
    } else if (hasApology) {
      score += 8
      tips.push('Add a concrete next step — invite them to contact you directly to resolve the issue')
    } else {
      tips.push('For a low-star review, include an apology and a direct way to contact you')
    }
  } else {
    score += 10
  }

  // 6. Closes with forward-looking invite (0–10 pts)
  const hasInvite = ['see you', 'visit again', 'come back', 'hope to see', 'look forward', 'welcome you', 'next time', 'फिर से', 'दोबारा'].some(
    (w) => lower.includes(w)
  )
  if (hasInvite) {
    score += 10
    highlights.push('Invites customer to return')
  } else {
    tips.push('End with a warm closing — invite them back or express you look forward to serving them again')
  }

  // 7. No ALL-CAPS shouting (0–5 pts)
  const capsWords = words.filter((w) => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w))
  if (capsWords.length <= 1) {
    score += 5
  } else {
    tips.push('Avoid ALL-CAPS words — they come across as shouting')
  }

  // Clamp
  score = Math.min(100, Math.max(0, score))

  const grade: ReplyQualityResult['grade'] =
    score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'

  const label =
    grade === 'A' ? 'Excellent' : grade === 'B' ? 'Good' : grade === 'C' ? 'Needs work' : grade === 'D' ? 'Poor' : 'Very poor'

  return { score, grade, label, tips: tips.slice(0, 3), highlights: highlights.slice(0, 3) }
}
