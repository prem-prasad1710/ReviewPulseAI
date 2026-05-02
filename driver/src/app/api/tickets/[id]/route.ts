import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  body: z.string().min(10).max(12000).optional(),
  status: z.string().max(32).optional(),
  nextAt: z.string().max(40).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const existing = await prisma.supportTicket.findFirst({
    where: { id: params.id, userId: uid },
  });
  if (!existing) return Response.json({ error: "not found" }, { status: 404 });
  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const nextAt =
    parsed.data.nextAt === undefined
      ? undefined
      : parsed.data.nextAt === null || parsed.data.nextAt === ""
        ? null
        : new Date(parsed.data.nextAt);
  const row = await prisma.supportTicket.update({
    where: { id: params.id },
    data: {
      body: parsed.data.body ?? undefined,
      status: parsed.data.status ?? undefined,
      nextAt: nextAt === undefined ? undefined : nextAt,
    },
  });
  return Response.json({ ticket: row });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const existing = await prisma.supportTicket.findFirst({
    where: { id: params.id, userId: uid },
  });
  if (!existing) return Response.json({ error: "not found" }, { status: 404 });
  await prisma.supportTicket.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
