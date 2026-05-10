import { Badge } from '@/components/ui/badge'

export default function SentimentBadge({
  sentiment,
}: {
  sentiment: 'positive' | 'neutral' | 'negative'
}) {
  if (sentiment === 'positive') {
    return (
      <Badge className="border border-emerald-200/80 bg-[#DCFCE7] text-[#166534] dark:border-emerald-800/60 dark:bg-emerald-950/55 dark:text-emerald-300">
        Positive
      </Badge>
    )
  }

  if (sentiment === 'negative') {
    return (
      <Badge className="border border-red-200/80 bg-[#FEE2E2] text-[#991B1B] dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
        Negative
      </Badge>
    )
  }

  return (
    <Badge className="border border-amber-200/80 bg-[#FEF9C3] text-[#854D0E] dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-200">
      Neutral
    </Badge>
  )
}
