import { Badge } from '@/components/ui/badge'

export default function SentimentBadge({
  sentiment,
}: {
  sentiment: 'positive' | 'neutral' | 'negative'
}) {
  if (sentiment === 'positive') {
    return <Badge className="bg-[#DCFCE7] text-[#166534]">Positive</Badge>
  }

  if (sentiment === 'negative') {
    return <Badge className="bg-[#FEE2E2] text-[#991B1B]">Negative</Badge>
  }

  return <Badge className="bg-[#FEF9C3] text-[#854D0E]">Neutral</Badge>
}
