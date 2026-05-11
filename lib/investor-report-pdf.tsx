import React from 'react'
import { Document, Page, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 22, marginBottom: 6 },
  h2: { fontSize: 12, marginTop: 14, marginBottom: 4 },
  muted: { fontSize: 9, color: '#444' },
})

export type InvestorReportInput = {
  businessName: string
  monthLabel: string
  avgRating: number
  totalReviews: number
  velocity90d: number
  executiveBullets: string[]
}

function InvestorDoc(props: InvestorReportInput) {
  return (
    <Document title={`Investor brief — ${props.businessName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{props.businessName}</Text>
        <Text style={styles.muted}>Reputation snapshot · {props.monthLabel}</Text>
        <Text style={{ marginTop: 10 }}>Average rating: {props.avgRating.toFixed(2)}★</Text>
        <Text>Total reviews indexed: {props.totalReviews}</Text>
        <Text>90-day review velocity: {props.velocity90d}</Text>
        <Text style={styles.h2}>Narrative</Text>
        {props.executiveBullets.map((b, i) => (
          <Text key={i}>• {b}</Text>
        ))}
        <Text style={{ marginTop: 24, fontSize: 8, color: '#666' }}>
          ReviewPulse · C6 Investor-ready reputation one-pager · Confidential
        </Text>
      </Page>
    </Document>
  )
}

export async function buildInvestorReportBuffer(input: InvestorReportInput): Promise<Buffer> {
  return renderToBuffer(<InvestorDoc {...input} />)
}
