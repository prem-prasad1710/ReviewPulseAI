import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface WeeklyDigestProps {
  businessName: string
  totalReviews: number
  avgRatingThisWeek: number
  avgRatingLastWeek: number
  positive: number
  neutral: number
  negative: number
  topUnanswered: { reviewerName: string; rating: number; comment?: string }[]
  dashboardUrl: string
  unsubscribeUrl: string
}

export default function WeeklyDigest(props: WeeklyDigestProps) {
  const trend = (props.avgRatingThisWeek - props.avgRatingLastWeek).toFixed(1)
  const trendPrefix = Number(trend) >= 0 ? '+' : ''

  return (
    <Html>
      <Head />
      <Preview>Your weekly review snapshot is ready</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '24px' }}>
          <Heading>Weekly Digest - {props.businessName}</Heading>
          <Text>Total reviews this week: {props.totalReviews}</Text>
          <Text>
            Average rating: {props.avgRatingThisWeek.toFixed(1)} ({trendPrefix}
            {trend} vs last week)
          </Text>
          <Text>
            Sentiment split: {props.positive} positive, {props.neutral} neutral, {props.negative} negative
          </Text>

          <Section>
            <Heading as="h3">Top unanswered reviews</Heading>
            {props.topUnanswered.slice(0, 3).map((item, index) => (
              <Text key={`${item.reviewerName}-${index}`}>
                {item.reviewerName} ({item.rating}/5): {item.comment || 'No text review'}
              </Text>
            ))}
          </Section>

          <Section style={{ marginTop: '20px' }}>
            <Button
              href={props.dashboardUrl}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 16px' }}
            >
              Reply Now
            </Button>
          </Section>

          <Text style={{ marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
            Unsubscribe: <a href={props.unsubscribeUrl}>{props.unsubscribeUrl}</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
