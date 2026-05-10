import { handleWhatsAppInbound } from "@/lib/wa/handler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

type WaPayload = {
  entry?: {
    changes?: {
      value?: {
        messages?: { from: string; type: string; text?: { body?: string } }[];
      };
    }[];
  }[];
};

export async function POST(req: Request) {
  let body: WaPayload;
  try {
    body = (await req.json()) as WaPayload;
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const messages = body.entry?.flatMap((e) => e.changes?.flatMap((c) => c.value?.messages ?? []) ?? []) ?? [];
  for (const m of messages) {
    if (m.type === "text" && m.text?.body && m.from) {
      await handleWhatsAppInbound(m.from, m.text.body);
    }
  }
  return new Response("OK", { status: 200 });
}
