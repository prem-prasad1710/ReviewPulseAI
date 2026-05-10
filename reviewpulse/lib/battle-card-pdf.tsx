import React from 'react'
import { Document, Page, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 44, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 20, marginBottom: 8 },
  h2: { fontSize: 12, marginTop: 12, marginBottom: 4 },
  row: { marginBottom: 3 },
  box: { marginTop: 8, padding: 8, borderWidth: 1, borderColor: '#ddd' },
})

export type BattleCardInput = {
  outletName: string
  selfAvg: number
  selfReviewCount: number
  selfPosThemes: string[]
  selfNegThemes: string[]
  rivalName?: string
  rivalPosThemes?: string[]
  rivalNegThemes?: string[]
}

function BattleCardDoc(props: BattleCardInput) {
  return (
    <Document title={`Battle card — ${props.outletName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Competitor battle card</Text>
        <Text style={styles.row}>{props.outletName}</Text>
        <Text style={styles.row}>
          GBP avg {props.selfAvg.toFixed(2)}★ · {props.selfReviewCount} reviews
        </Text>
        <Text style={styles.h2}>Your strengths (themes)</Text>
        {props.selfPosThemes.length ? (
          props.selfPosThemes.map((t, i) => <Text key={`p${i}`}>• {t}</Text>)
        ) : (
          <Text>— Add competitor spy themes or sync more reviews.</Text>
        )}
        <Text style={styles.h2}>Watch-outs</Text>
        {props.selfNegThemes.length ? (
          props.selfNegThemes.map((t, i) => <Text key={`n${i}`}>• {t}</Text>)
        ) : (
          <Text>—</Text>
        )}
        {props.rivalName ? (
          <>
            <Text style={styles.h2}>Rival snapshot — {props.rivalName}</Text>
            <Text style={styles.h2}>Their praise themes</Text>
            {(props.rivalPosThemes || []).map((t, i) => (
              <Text key={`rp${i}`}>• {t}</Text>
            ))}
            <Text style={styles.h2}>Their complaint themes</Text>
            {(props.rivalNegThemes || []).map((t, i) => (
              <Text key={`rn${i}`}>• {t}</Text>
            ))}
          </>
        ) : (
          <Text style={[styles.box, { marginTop: 14 }]}>
            Add a tracked competitor in ReviewPulse to populate the rival column.
          </Text>
        )}
        <Text style={{ marginTop: 20, fontSize: 8, color: '#666' }}>
          ReviewPulse · A3 Competitor battle card · For internal use
        </Text>
      </Page>
    </Document>
  )
}

export async function buildBattleCardBuffer(input: BattleCardInput): Promise<Buffer> {
  return renderToBuffer(<BattleCardDoc {...input} />)
}
