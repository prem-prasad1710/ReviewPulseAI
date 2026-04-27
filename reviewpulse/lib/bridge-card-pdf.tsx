import React from 'react'
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    width: '105mm',
    height: '148mm',
    padding: 24,
    fontFamily: 'Helvetica',
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, marginTop: 4 },
  sub2: { fontSize: 12, marginTop: 2, color: '#333' },
  qrWrap: { alignItems: 'center', marginTop: 12 },
  hint: { fontSize: 10, marginTop: 8, textAlign: 'center', color: '#444' },
  nfc: { fontSize: 10, marginTop: 10, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 12, left: 24, right: 24, fontSize: 7, color: '#888', textAlign: 'center' },
})

export type BridgeCardInput = {
  businessName: string
  qrDataUrl: string
}

function BridgeCardDocument(props: BridgeCardInput) {
  return (
    <Document title={`Review card — ${props.businessName}`}>
      <Page size="A6" style={styles.page}>
        <Text style={styles.title}>{props.businessName}</Text>
        <Text style={styles.subtitle}>Enjoyed your visit?</Text>
        <Text style={styles.sub2}>Leave us a Google review</Text>
        <View style={styles.qrWrap}>
          {/* @react-pdf/renderer Image has no alt; decorative QR */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={props.qrDataUrl} style={{ width: 170, height: 170 }} />
        </View>
        <Text style={styles.hint}>Scan to leave a review · Takes 30 seconds</Text>
        <Text style={styles.nfc}>Or tap your phone here (NFC)</Text>
        <Text style={styles.footer}>Powered by ReviewPulse</Text>
      </Page>
    </Document>
  )
}

export async function buildBridgeCardBuffer(input: BridgeCardInput): Promise<Buffer> {
  const element = <BridgeCardDocument {...input} />
  return renderToBuffer(element)
}
