import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";
import { checkScamText } from "@/lib/engines/scam";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) return Response.json({ error: "text required" }, { status: 400 });
  const r = checkScamText(text);
  await prisma.communitySignal.create({
    data: {
      patternKey: "web_scam_check",
      weight: 1,
      note: text.slice(0, 500),
    },
  });
  return Response.json(r);
}
