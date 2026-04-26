import React from 'react'
import { Document, Page, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica' },
  h1: { fontSize: 22, marginBottom: 10 },
  h2: { fontSize: 13, marginTop: 14, marginBottom: 6 },
  muted: { fontSize: 10, color: '#444' },
})

export type MonthlyReportInput = {
  businessName: string
  monthLabel: string
  score: number
  grade: string
  executiveSummary: string[]
  statsLines: string[]
}

function MonthlyReportDocument(props: MonthlyReportInput) {
  return (
    <Document title={`${props.businessName} — ${props.monthLabel}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{props.businessName}</Text>
        <Text style={styles.muted}>Reputation report — {props.monthLabel}</Text>
        <Text style={{ marginTop: 10 }}>Score: {props.score} (Grade {props.grade})</Text>
        <Text style={styles.h2}>Executive summary</Text>
        {props.executiveSummary.map((line, i) => (
          <Text key={i}>• {line}</Text>
        ))}
        <Text style={styles.h2}>Performance</Text>
        {props.statsLines.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Page>
    </Document>
  )
}

export async function buildMonthlyReportBuffer(input: MonthlyReportInput): Promise<Buffer> {
  const element = <MonthlyReportDocument {...input} />
  return renderToBuffer(element)
}
