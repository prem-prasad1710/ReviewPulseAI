import { NextResponse } from 'next/server'

function stripCdataBreaker(s: string): string {
  return s.replace(/\]\]>/g, ']] >')
}

/** B4 — TwiML reply using a Twilio Content template (single variable `1` = message body). */
export function twimlMessageFromContentTemplate(contentSid: string, messageBody: string): NextResponse {
  const safe = stripCdataBreaker(messageBody.slice(0, 1000))
  const vars = JSON.stringify({ '1': safe })
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    <Content type="application/x-twilio-content" src="${contentSid}">
      <ContentVariables><![CDATA[${vars}]]></ContentVariables>
    </Content>
  </Message>
</Response>`
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}
