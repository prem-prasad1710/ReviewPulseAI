import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  platform: z.string().max(32).optional(),
  templateKey: z.string().max(64).optional(),
  body: z.string().min(10).max(12000),
  status: z.string().max(32).optional(),
});

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ tickets });
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const row = await prisma.supportTicket.create({
    data: {
      userId: uid,
      platform: parsed.data.platform ?? null,
      templateKey: parsed.data.templateKey ?? null,
      body: parsed.data.body,
      status: parsed.data.status ?? "draft",
    },
  });
  return Response.json({ ticket: row });
}
